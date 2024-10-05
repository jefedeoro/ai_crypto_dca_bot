import os
import logging
import json
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

def run_news_aggregation(output_path):
    try:
        print(f"Starting news aggregation process. Output path: {output_path}")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

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