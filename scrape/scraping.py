import logging
import random
import json
import time
import feedparser
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from functools import wraps
from .config import NEWS_SOURCES, KEYWORDS, MAX_STORIES, BLOCKED_SITES
from .selection import select_best_headlines
from .content_extractor import get_article_content

def retry(max_attempts=3):
    """Decorator for retrying a function if an exception occurs."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except PlaywrightTimeoutError as e:
                    attempts += 1
                    logging.warning(f"Timeout in {func.__name__}: {str(e)} (Attempt {attempts} of {max_attempts})")
                    if attempts == max_attempts:
                        raise
                except Exception as e:
                    attempts += 1
                    logging.error(f"Error in {func.__name__}: {str(e)} (Attempt {attempts} of {max_attempts})", exc_info=True)
                    if attempts == max_attempts:
                        raise
        return wrapper
    return decorator

def is_blocked(url):
    """Check if the given URL is from a blocked site."""
    return any(blocked_site in url for blocked_site in BLOCKED_SITES)

@retry(max_attempts=3)
def scrape_rss_feed(url, name, nonce_start):
    """Scrape headlines from an RSS feed."""
    try:
        logging.info(f"Fetching RSS feed from {url}")
        
        feed = feedparser.parse(url)
        headlines = []
        nonce = nonce_start

        if name == 'NEARWeek':
            if feed.entries:
                latest_newsletter = feed.entries[0]
                return [{'title': latest_newsletter.title, 'link': latest_newsletter.link}], nonce
            else:
                logging.warning("No entries found in NEARWeek RSS feed")
                return [], nonce

        for entry in feed.entries:
            title = entry.title
            link = entry.link
            if title and link and not is_blocked(link):
                logging.info(f"Checking headline: {title}")
                headlines.append({
                    'nonce': f"{nonce:05d}",
                    'title': title,
                    'link': link,
                    'source': name
                })
                nonce += 1
                logging.info(f"Added headline: {title}")
            elif is_blocked(link):
                logging.info(f"Blocked headline from {link}")

        logging.info(f"Collected {len(headlines)} headlines from {name}")
        return headlines, nonce
    except Exception as e:
        logging.error(f"Error scraping RSS feed for {name}: {str(e)}", exc_info=True)
        return [], nonce_start

@retry(max_attempts=3)
def scrape_nearweek_newsletter(page, newsletter_url, nonce_start):
    """Scrape headlines from the latest NEARWeek newsletter page."""
    try:
        logging.info(f"Navigating to NEARWeek newsletter: {newsletter_url}")
        page.goto(newsletter_url, wait_until="networkidle", timeout=60000)  # Increase timeout to 60 seconds
        page.wait_for_timeout(random.randint(3000, 5000))  # Random delay to mimic human behavior
        
        headlines = []
        nonce = nonce_start

        content = page.content()
        soup = BeautifulSoup(content, 'html.parser')
        
        # Look for all links in the newsletter
        story_links = soup.find_all('a')

        for link in story_links:
            title = link.get_text().strip()
            href = link.get('href')
            
            # Check if it's a valid headline (has both title and link)
            if title and href and not is_blocked(href) and href.startswith('https'):
                
                logging.info(f"Checking story headline: {title}")
                headlines.append({
                    'nonce': f"{nonce:05d}",
                    'title': title,
                    'link': href,
                    'source': 'NEARWeek'
                })
                nonce += 1
                logging.info(f"Added story headline: {title}")
            elif is_blocked(href):
                logging.info(f"Blocked headline from {href}")

        logging.info(f"Collected {len(headlines)} stories from the NEARWeek newsletter")
        return headlines, nonce
    except PlaywrightTimeoutError:
        logging.error(f"Timeout error scraping NEARWeek newsletter page")
        return [], nonce_start
    except Exception as e:
        logging.error(f"Error scraping NEARWeek newsletter page: {str(e)}", exc_info=True)
        return [], nonce_start

@retry(max_attempts=3)
def scrape_website(page, source, nonce_start):
    """Scrape headlines from a single news source."""
    url = source['url']
    name = source['name']
    
    # Use RSS feed for NEARWeek
    if name == 'NEARWeek':
        rss_headlines, _ = scrape_rss_feed(url, name, nonce_start)
        
        # Scrape the most recent newsletter for additional headlines
        if rss_headlines:
            latest_newsletter = rss_headlines[0]  # Assume the first entry is the most recent
            logging.info(f"Attempting to scrape the latest NEARWeek newsletter: {latest_newsletter['link']}")
            newsletter_headlines, nonce = scrape_nearweek_newsletter(page, latest_newsletter['link'], nonce_start)
            return newsletter_headlines, nonce
        return [], nonce_start

    logging.info(f"Scraping {name} from {url}")
    page.goto(url, wait_until="networkidle", timeout=60000)  # Increase timeout to 60 seconds
    logging.info(f"Page loaded for {name}")
    
    page.wait_for_timeout(random.randint(5000, 10000))  # Random delay to mimic human behavior
    logging.info("Completed waiting after load")
    
    headlines = []
    nonce = nonce_start

    content = page.content()
    soup = BeautifulSoup(content, 'html.parser')
    
    if name == 'Google News':
        # Handle Google News search results
        items = soup.select('div.SoaBEf')
        for item in items:
            title_elem = item.find('div', {'role': 'heading'})
            link_elem = item.find('a')
            source_elem = item.find('div', {'class': 'OSrXXb'})
            
            if title_elem and link_elem:
                title = title_elem.get_text().strip()
                link = link_elem.get('href', '')
                source_info = source_elem.get_text().strip() if source_elem else "Unknown Source"
                
                if not link.startswith('http'):
                    link = 'https://www.google.com' + link
                
                if link and title and not is_blocked(link):
                    logging.info(f"Checking Google News headline: {title}")
                    headlines.append({
                        'nonce': f"{nonce:05d}",
                        'title': title,
                        'link': link,
                        'description': source_info,
                        'source': name
                    })
                    nonce += 1
                    logging.info(f"Added Google News headline: {title}")
    else:
        # Handle other news sources
        if name == 'NewsBTC':
            items = soup.select('.jnews_search_content_wrapper .jeg_post')
        elif name == 'CryptoNews':
            items = soup.select('.aside-news-list a')
        elif name == 'TheBlock':
            items = soup.select('.popularRail.d-print-none a')
        else:
            items = []

        for item in items:
            title = item.select_one('.jeg_post_title a').text.strip() if item.select_one('.jeg_post_title a') else None
            link = item.select_one('.jeg_post_title a')['href'] if item.select_one('.jeg_post_title a') else None
            description = item.select_one('.jeg_post_excerpt').text.strip() if item.select_one('.jeg_post_excerpt') else None

            if link and title and not is_blocked(link):
                if not link.startswith('http'):
                    link = f'{url.rstrip("/")}/{link.lstrip("/")}'
                logging.info(f"Checking headline: {title}")
                headlines.append({
                    'nonce': f"{nonce:05d}",
                    'title': title,
                    'link': link,
                    'description': description,
                    'source': name
                })
                nonce += 1
                logging.info(f"Added headline: {title}")
            elif is_blocked(link):
                logging.info(f"Blocked headline from {link}")

    logging.info(f"Collected {len(headlines)} headlines from {name}")
    return headlines, nonce

@retry(max_attempts=3)
def scrape_article(page, article):
    try:
        link = article['link']
        logging.info(f"Navigating to article: {link}")
        page.goto(link, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(random.randint(3000, 5000))

        # Get the full HTML content
        content = page.content()
        
        # Use GPT-4 to extract clean content
        article_content = get_article_content(link)
        
        if article_content:
            article['article'] = article_content
            # Set default values for author and date since they'll be included in the markdown if available
            article['author'] = "Unknown"
            article['date'] = "Unknown"
            return True
        else:
            logging.warning(f"No article content extracted for: {article['title']}")
            return False

    except PlaywrightTimeoutError:
        logging.error(f"Timeout error scraping article: {article['link']}")
        return False
    except Exception as e:
        logging.error(f"Error scraping article {article['link']}: {str(e)}", exc_info=True)
        return False

@retry(max_attempts=3)
def scrape_headlines(output_path):
    """Scrape headlines from all news sources."""
    logging.info(f"Starting to scrape headlines. Output path: {output_path}")
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
                logging.info(f"Added {len(source_headlines)} headlines from {source['name']}")
            except Exception as e:
                logging.error(f"Error processing source {source['name']}: {e}", exc_info=True)
        context.close()
        browser.close()

    # Save headlines to a JSON file
    try:
        with open(output_path, 'w') as f:
            json.dump(all_headlines, f, indent=4)
        logging.info(f"Saved {len(all_headlines)} headlines to {output_path}")
    except IOError as e:
        logging.error(f"Error saving headlines to {output_path}: {str(e)}")

@retry(max_attempts=3)
def select_and_scrape_stories(headlines_path, selected_path, output_path):
    """Select the best headlines and scrape their full articles."""
    logging.info(f"Starting to select and scrape stories. Headlines path: {headlines_path}")
    # Load headlines from file
    try:
        with open(headlines_path, 'r') as f:
            all_headlines = json.load(f)
        logging.info(f"Loaded {len(all_headlines)} headlines from {headlines_path}")
    except IOError as e:
        logging.error(f"Error reading headlines from {headlines_path}: {str(e)}")
        return

    # Select best headlines
    selected_nonces = select_best_headlines(all_headlines, max_articles=MAX_STORIES)
    selected_articles = [
        headline for headline in all_headlines if headline['nonce'] in selected_nonces
    ]

    # Replace blocked URLs with non-blocked ones
    non_blocked_headlines = [h for h in all_headlines if not is_blocked(h['link']) and h not in selected_articles]
    for i, article in enumerate(selected_articles):
        if is_blocked(article['link']):
            logging.info(f"Replacing blocked headline: {article['title']}")
            if non_blocked_headlines:
                replacement = non_blocked_headlines.pop(0)
                selected_articles[i] = replacement
                logging.info(f"Replaced with: {replacement['title']}")
            else:
                logging.warning("No more non-blocked headlines available for replacement")

    logging.info(f"Selected {len(selected_articles)} articles for full scraping")

    # Save selected headlines
    try:
        with open(selected_path, 'w') as f:
            json.dump(selected_articles, f, indent=4)
        logging.info(f"Saved {len(selected_articles)} selected headlines to {selected_path}")
    except IOError as e:
        logging.error(f"Error saving selected headlines to {selected_path}: {str(e)}")
        return

    # Scrape full articles
    logging.info("Starting to scrape full articles")
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
        logging.info(f"Saved {len(successful_articles)} full articles to {output_path}")
    except IOError as e:
        logging.error(f"Error saving articles to {output_path}: {str(e)}")

    # If no articles were successfully scraped, create an empty file
    if not successful_articles:
        logging.warning("No articles were successfully scraped. Creating an empty file.")
        with open(output_path, 'w') as f:
            json.dump([], f)
        logging.warning("Created an empty file as no articles were successfully scraped.")
