# scheduler.py

import schedule
import time
import os
from .scraping import scrape_headlines, select_and_scrape_stories
from .config import RESULT_FOLDER

def scheduled_task():
    headlines_path = os.path.join(RESULT_FOLDER, "headlines.json")
    selected_path = os.path.join(RESULT_FOLDER, "selected.json")
    output_path = os.path.join(RESULT_FOLDER, "stories.json")
    scrape_headlines(headlines_path)
    select_and_scrape_stories(headlines_path, selected_path, output_path)

def schedule_scraping():
    schedule.every(12).hours.do(scheduled_task)
    while True:
        schedule.run_pending()
        time.sleep(1)
