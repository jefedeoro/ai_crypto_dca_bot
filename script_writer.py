# script_writer.py

import json
import os
from itertools import cycle
from datetime import datetime, timezone

def group_stories(articles):
    # This is a simple grouping based on the first word of the title
    # You may want to implement a more sophisticated grouping algorithm
    groups = {}
    for article in articles:
        key = article['title'].split()[0].lower()
        if key not in groups:
            groups[key] = []
        groups[key].append(article)
    return list(groups.values())

def write_script(input_path, output_path):
    with open(input_path, 'r') as f:
        articles = json.load(f)

    grouped_articles = group_stories(articles)
    speakers = cycle(['man1', 'woman1', 'man2', 'woman2'])

    # Generate the current UTC time for the introduction
    current_time = datetime.now(timezone.utc)
    intro_text = f"TG-DCA update for {current_time.strftime('%B %d, %Y, %I:%M %p')} UTC."

    script = [
        {
            "title": "Introduction",
            "content": [
                {
                    "speaker": next(speakers),
                    "text": intro_text
                }
            ]
        }
    ]

    for group in grouped_articles:
        chapter = {
            "title": f"News Group: {group[0]['title'].split()[0]}",
            "content": []
        }
        for article in group:
            chapter["content"].extend([
                {
                    "speaker": next(speakers),
                    "text": f"Our next story is titled: {article['title']}, written by {article['author']} on {article['date']}."
                },
                {
                    "speaker": next(speakers),
                    "text": f"Here's a summary: {article['summary']}"
                }
            ])
        script.append(chapter)

    # We're removing the premade outro as requested

    with open(output_path, 'w') as f:
        json.dump(script, f, indent=2)

if __name__ == '__main__':
    result_folder = os.getenv('TG_NEWS_RESULT_FOLDER')
    if result_folder is None:
        print("Warning: TG_NEWS_RESULT_FOLDER environment variable not set. Using default path.")
        result_folder = 'data'
    
    input_path = os.path.join(result_folder, "summarized_news.json")
    output_path = os.path.join(result_folder, "script.json")
    
    write_script(input_path, output_path)
    print(f"Script written and saved to: {output_path}")
