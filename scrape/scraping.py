# scraping.py

import logging
import random
import json
import time
import feedparser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

from .config import NEWS_SOURCES, KEYWORDS, MAX_STORIES
from .selection import select_best_headlines

def scrape_rss_feed(url, name, nonce_start):
    """Scrape headlines from an RSS feed."""
    try:
        print(f"Scraping RSS feed for {name} from {url}")
        logging.info(f"Fetching RSS feed from {url}")
        
        feed = feedparser.parse(url)
        headlines = []
        nonce = nonce_start

        for entry in feed.entries:
            title = entry.title
            link = entry.link
            if title and link:
                print(f"Checking headline: {title}")
                headlines.append({
                    'nonce': f"{nonce:05d}",
                    'title': title,
                    'link': link,
                    'source': name
                })
                nonce += 1
                print(f"Added headline: {title}")

        print(f"Collected {len(headlines)} headlines from {name}")
        logging.info(f"Collected {len(headlines)} headlines from {name}")
        return headlines, nonce
    except Exception as e:
        print(f"Error scraping RSS feed for {name}: {str(e)}")
        logging.error(f"Error scraping RSS feed for {name}: {str(e)}", exc_info=True)
        return [], nonce_start

def scrape_website(page, source, nonce_start, max_retries=3):
    """Scrape headlines from a single news source."""
    url = source['url']
    name = source['name']
    
    # Use RSS feed for NEARWeek
    if name == 'NEARWeek':
        return scrape_rss_feed(url, name, nonce_start)
    
    for attempt in range(max_retries):
        try:
            print(f"Scraping {name} from {url} (Attempt {attempt + 1})")
            logging.info(f"Navigating to {url} (Attempt {attempt + 1})")
            page.goto(url, wait_until="networkidle", timeout=30000)  # 2 minutes timeout
            logging.info(f"Page loaded for {name}")
            
            page.wait_for_timeout(random.randint(5000, 10000))  # Increased random delay
            logging.info("Completed waiting after load")
            
            headlines = []
            nonce = nonce_start

            content = page.content()
            soup = BeautifulSoup(content, 'html.parser')
            if name == 'NewsBTC':
                items = soup.select('.fw-carousel__items.fw-carousel__items--desktop-carousel a')
            elif name == 'CryptoNews':
                items = soup.select('.aside-news-list a')
            elif name == 'TheBlock':
                items = soup.select('.popularRail.d-print-none a')
            else:
                items = []

            for item in items:
                title = item.get_text().strip()
                link = item.get('href')
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

            print(f"Collected {len(headlines)} headlines from {name}")
            logging.info(f"Collected {len(headlines)} headlines from {name}")
            return headlines, nonce
        except PlaywrightTimeoutError:
            print(f"Timeout error scraping {name} (Attempt {attempt + 1})")
            logging.error(f"Timeout error scraping {name} (Attempt {attempt + 1})")
            if attempt == max_retries - 1:
                return [], nonce_start
        except Exception as e:
            print(f"Error scraping {name}: {str(e)} (Attempt {attempt + 1})")
            logging.error(f"Error scraping {name}: {str(e)} (Attempt {attempt + 1})", exc_info=True)
            if attempt == max_retries - 1:
                return [], nonce_start

def scrape_article(page, article):
    try:
        link = article['link']
        print(f"Scraping article: {link}")
        logging.info(f"Navigating to article: {link}")
        page.goto(link, wait_until="networkidle", timeout=60000)  # 60 seconds timeout
        page.wait_for_timeout(random.randint(3000, 5000))  # Increased random delay

        # Parsing logic based on the news source
        selectors = {
            'NEARWeek': {
                'content': 'article',
                'author': '.author-name',
                'date': '.post-date'
            },
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
        
        content_elem = page.query_selector(source_selectors.get('content'))
        author_elem = page.query_selector(source_selectors.get('author'))
        date_elem = page.query_selector(source_selectors.get('date'))

        if content_elem:
            article['article'] = content_elem.inner_text().strip()
            article['author'] = author_elem.inner_text().strip() if author_elem else "Unknown"
            article['date'] = date_elem.inner_text().strip() if date_elem else "Unknown"
            
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
