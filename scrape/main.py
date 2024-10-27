# main.py

import os
import logging
import argparse
from .utils import setup_logging
from .config import RESULT_FOLDER
from .scraping import scrape_headlines, select_and_scrape_stories
import schedule
import time
from routes.podcast_api import app as podcast_app  # Use absolute import


def scheduled_task():
    headlines_path = os.path.join(RESULT_FOLDER, "headlines.json")
    selected_path = os.path.join(RESULT_FOLDER, "selected.json")
    output_path = os.path.join(RESULT_FOLDER, "stories.json")
    scrape_headlines(headlines_path)
    select_and_scrape_stories(headlines_path, selected_path, output_path)

def main():
    setup_logging()
    os.makedirs(RESULT_FOLDER, exist_ok=True)

    parser = argparse.ArgumentParser(description='Crypto News Scraper')
    parser.add_argument('--schedule', action='store_true', help='Schedule the scraper to run every 12 hours')
    args = parser.parse_args()

    if args.schedule:
        schedule.every(12).hours.do(scheduled_task)
        logging.info("Scheduled scraper to run every 12 hours.")
        while True:
            schedule.run_pending()
            time.sleep(1)
    else:
        scheduled_task()

if __name__ == '__main__':
    main()
    podcast_app.run(debug=True)
