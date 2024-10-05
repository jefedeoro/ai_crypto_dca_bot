# scraping.py

import logging
import random
import json
import time
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

from .config import NEWS_SOURCES, KEYWORDS, MAX_STORIES
from .selection import select_best_headlines

def scrape_website(page, source, nonce_start):
    """Scrape headlines from a single news source."""
    url = source['url']
    name = source['name']
    try:
        print(f"Scraping {name} from {url}")
        logging.info(f"Navigating to {url}")
        page.goto(url, wait_until="networkidle", timeout=30000)  # 30 seconds timeout
        logging.info(f"Page loaded for {name}")
        page.wait_for_timeout(random.randint(1000, 3000))  # Random delay
        content = page.content()
        logging.debug(f"Content length for {name}: {len(content)}")
        soup = BeautifulSoup(content, 'html.parser')
        headlines = []
        nonce = nonce_start

        # Parsing logic based on the news source
        if  name == 'NewsBTC':
            items = soup.select('.fw-carousel__items.fw-carousel__items--desktop-carousel a')
        elif name == 'CryptoNews':
            items = soup.select('.aside-news-list a')
        elif name == 'TheBlock':
            items = soup.select('.popularRail.d-print-none a')
        else:
            items = []

        print(f"Found {len(items)} potential articles for {name}")
        logging.debug(f"Found {len(items)} potential articles for {name}")

        for item in items:
            title_elem = item.select_one('a') if name == 'CoinTelegraph' else item
            if title_elem:
                title = title_elem.get_text().strip()
                link = title_elem.get('href')
                if link and title:
                    if not link.startswith('http'):
                        link = f'{url.rstrip("/")}/{link.lstrip("/")}'
                    print(f"Checking headline: {title}")
                    headlines.append({
                        'nonce': f"{nonce:05d}",
                        'title': title,
                        'link': link,
                        'source': name
                    })
                    nonce += 1
                    print(f"Added headline: {title}")
                else:
                    print(f"Skipped item (no title or link)")
            else:
                print(f"Skipped item (no title element)")

        print(f"Collected {len(headlines)} headlines from {name}")
        logging.info(f"Collected {len(headlines)} headlines from {name}")
        return headlines, nonce
    except PlaywrightTimeoutError:
        print(f"Timeout error scraping {name}")
        logging.error(f"Timeout error scraping {name}")
        return [], nonce_start
    except Exception as e:
        print(f"Error scraping {name}: {str(e)}")
        logging.error(f"Error scraping {name}: {str(e)}", exc_info=True)
        return [], nonce_start

def scrape_headlines(output_path):
    """Scrape headlines from all news sources."""
    print(f"Starting to scrape headlines. Output path: {output_path}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        all_headlines = []
        nonce = 1
        for source in NEWS_SOURCES:
            try:
                source_headlines, nonce = scrape_website(page, source, nonce)
                all_headlines.extend(source_headlines)
                print(f"Added {len(source_headlines)} headlines from {source['name']}")
            except Exception as e:
                print(f"Error processing source {source['name']}: {e}")
                logging.error(f"Error processing source {source['name']}: {e}", exc_info=True)
        context.close()
        browser.close()

    # Save headlines to a JSON file
    try:
        with open(output_path, 'w') as f:
            json.dump(all_headlines, f, indent=4)
        print(f"Saved {len(all_headlines)} headlines to {output_path}")
        logging.info(f"Saved {len(all_headlines)} headlines to {output_path}")
    except IOError as e:
        print(f"Error saving headlines to {output_path}: {str(e)}")
        logging.error(f"Error saving headlines to {output_path}: {str(e)}")

def scrape_article(page, article):
    try:
        link = article['link']
        print(f"Scraping article: {link}")
        logging.info(f"Navigating to article: {link}")
        page.goto(link, wait_until="networkidle", timeout=30000)  # 30 seconds timeout
        page.wait_for_timeout(random.randint(1000, 3000))
        article_content = BeautifulSoup(page.content(), 'html.parser')

        # Parsing logic based on the news source
        selectors = {
            'NewsBTC': {
                'content': '.content-inner',
                'author': '.author-name',
                'date': '.post-date'
            },
            'CryptoNews': {
                'content': '.article-single__content.category_contents_details',
                'author': '.article-single__author-name',
                'date': '.article-single__date'
            },
            'TheBlock': {
                'content': '.article',
                'author': '.article__author-name',
                'date': '.article__date'
            }
        }

        source_selectors = selectors.get(article['source'], {})
        
        article_text = article_content.select_one(source_selectors.get('content'))
        author = article_content.select_one(source_selectors.get('author'))
        date = article_content.select_one(source_selectors.get('date'))

        if article_text:
            article['article'] = article_text.get_text(strip=True)
            article['author'] = author.get_text(strip=True) if author else "Unknown"
            article['date'] = date.get_text(strip=True) if date else "Unknown"
            
            print(f"Added full article: {article['title']}")
            logging.debug(f"Added full article: {article['title']}")
            logging.debug(f"Author: {article['author']}, Date: {article['date']}")
            return True
        else:
            print(f"No article content found for: {article['title']}")
            logging.warning(f"No article content found for: {article['title']}")
            logging.debug(f"Content selector: {source_selectors.get('content')}")
            logging.debug(f"Author selector: {source_selectors.get('author')}")
            logging.debug(f"Date selector: {source_selectors.get('date')}")
            return False
    except PlaywrightTimeoutError:
        print(f"Timeout error scraping article: {article['link']}")
        logging.error(f"Timeout error scraping article: {article['link']}")
        return False
    except Exception as e:
        print(f"Error scraping article {article['link']}: {str(e)}")
        logging.error(f"Error scraping article {article['link']}: {str(e)}", exc_info=True)
        return False

def select_and_scrape_stories(headlines_path, selected_path, output_path):
    """Select the best headlines and scrape their full articles."""
    print(f"Starting to select and scrape stories. Headlines path: {headlines_path}")
    # Load headlines from file
    try:
        with open(headlines_path, 'r') as f:
            all_headlines = json.load(f)
        print(f"Loaded {len(all_headlines)} headlines from {headlines_path}")
    except IOError as e:
        print(f"Error reading headlines from {headlines_path}: {str(e)}")
        logging.error(f"Error reading headlines from {headlines_path}: {str(e)}")
        return

    # Select best headlines
    selected_nonces = select_best_headlines(all_headlines, max_articles=MAX_STORIES)
    selected_articles = [
        headline for headline in all_headlines if headline['nonce'] in selected_nonces
    ]
    print(f"Selected {len(selected_articles)} articles for full scraping")

    # Save selected headlines
    try:
        with open(selected_path, 'w') as f:
            json.dump(selected_articles, f, indent=4)
        print(f"Saved {len(selected_articles)} selected headlines to {selected_path}")
        logging.info(f"Saved {len(selected_articles)} selected headlines to {selected_path}")
    except IOError as e:
        print(f"Error saving selected headlines to {selected_path}: {str(e)}")
        logging.error(f"Error saving selected headlines to {selected_path}: {str(e)}")
        return

    # Scrape full articles
    print("Starting to scrape full articles")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        successful_articles = []
        for article in selected_articles:
            if scrape_article(page, article):
                successful_articles.append(article)
            time.sleep(random.randint(1, 3))  # Delay to avoid detection

        context.close()
        browser.close()

    # Save articles to a JSON file
    try:
        with open(output_path, 'w') as f:
            json.dump(successful_articles, f, indent=4)
        print(f"Saved {len(successful_articles)} full articles to {output_path}")
        logging.info(f"Saved {len(successful_articles)} full articles to {output_path}")
    except IOError as e:
        print(f"Error saving articles to {output_path}: {str(e)}")
        logging.error(f"Error saving articles to {output_path}: {str(e)}")

    # If no articles were successfully scraped, create an empty file
    if not successful_articles:
        print("No articles were successfully scraped. Creating an empty file.")
        with open(output_path, 'w') as f:
            json.dump([], f)
        logging.warning("Created an empty file as no articles were successfully scraped.")
