import os
import logging
import json
import feedparser
from dotenv import load_dotenv
from scrape.scraping import scrape_headlines, select_and_scrape_stories
from scrape.config import RESULT_FOLDER
from scrape.utils import setup_logging
import schedule
import time

# Load environment variables
load_dotenv()

# Set up logging
setup_logging()

def scrape_near_week_rss(feed_url, output_path):
    try:
        # Parse the RSS feed
        feed = feedparser.parse(feed_url)
        
        # Debugging: Log feed information
        logging.debug(f"Feed keys: {feed.keys()}")
        logging.debug(f"Number of entries: {len(feed.entries)}")
        
        if feed.bozo:
            logging.error(f"Feed parsing error: {feed.bozo_exception}")
            return  # Exit the function if feed parsing failed
        
        # Get the most recent article
        if feed.entries:
            latest_entry = feed.entries[0]
            logging.debug(f"Latest entry keys: {latest_entry.keys()}")
            article = {
                "title": latest_entry.get('title', 'No Title'),
                "link": latest_entry.get('link', ''),
                "published": latest_entry.get('published', ''),
                "summary": latest_entry.get('summary', ''),
                "content": latest_entry.get('content', '')
            }
            
            # Save the latest article to the output path
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w') as f:
                json.dump(article, f, indent=4)
            
            logging.info(f"Latest NEAR Week article saved to: {output_path}")
        else:
            logging.warning("No articles found in NEAR Week RSS feed.")
    except Exception as e:
        logging.error(f"Error scraping NEAR Week RSS feed: {str(e)}", exc_info=True)

def run_news_aggregation(output_path):
    try:
        print(f"Starting news aggregation process. Output path: {output_path}")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Scrape NEAR Week RSS feed
        near_week_feed_url = "https://nearweek.com/feed"  # Updated URL
        rss_output_path = os.path.join(os.path.dirname(output_path), "near_week.json")
        print(f"Scraping NEAR Week RSS feed. Saving to: {rss_output_path}")
        scrape_near_week_rss(near_week_feed_url, rss_output_path)

        # Scrape headlines
        headlines_path = os.path.join(os.path.dirname(output_path), "headlines.json")
        print(f"Scraping headlines. Saving to: {headlines_path}")
        scrape_headlines(headlines_path)

        # Check if headlines were scraped successfully
        if os.path.exists(headlines_path):
            with open(headlines_path, 'r') as f:
                headlines = json.load(f)
            print(f"Number of headlines scraped: {len(headlines)}")
        else:
            print(f"Error: Headlines file not found at {headlines_path}")
            return

        # Select and scrape full stories
        print("Selecting and scraping full stories")
        select_and_scrape_stories(headlines_path, output_path, output_path)

        # Check if stories were scraped successfully
        if os.path.exists(output_path):
            with open(output_path, 'r') as f:
                stories = json.load(f)
            print(f"Number of full stories scraped: {len(stories)}")
        else:
            print(f"Error: Stories file not found at {output_path}")
            return

        print(f"News aggregation completed. Results saved to: {output_path}")
        logging.info(f"News scraped and saved to: {output_path}")

    except Exception as e:
        print(f"An error occurred during news aggregation: {str(e)}")
        logging.error(f"Error in news aggregation: {str(e)}", exc_info=True)

if __name__ == '__main__':
    output_path = os.path.join(RESULT_FOLDER, "news.json")
    run_news_aggregation(output_path)  # Initial run
    schedule.every(12).hours.do(run_news_aggregation, output_path)
    while True:
        schedule.run_pending()
        time.sleep(1)
