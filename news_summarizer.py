# news_summarizer.py

import json
import os
import logging
from scrape.openai_client import client

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def summarize_article(article):
    try:
        logging.info(f"Summarizing article: {article['title'][:100]}...")  # Log first 100 characters of title
        article_text = article.get('article', article['title'])
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes news articles for a crypto podcast with multiple speakers."},
                {"role": "user", "content": f"Summarize the following article in 2-3 short paragraphs. Make it conversational, interesting, and informative for crypto enthusiasts. Include key points that could be discussed by multiple speakers. Mention the author and date if available:\n\nTitle: {article['title']}\nAuthor: {article.get('author', 'Unknown')}\nDate: {article.get('date', 'Unknown')}\n\n{article_text}"}
            ],
            max_tokens=500,  # Slightly increased to allow for more detailed summaries
            temperature=0.7,
        )
        summary = response.choices[0].message.content.strip()
        logging.info(f"Summary generated: {summary[:100]}...")  # Log first 100 characters of summary
        return summary
    except Exception as e:
        logging.error(f"Error summarizing article: {str(e)}")
        return f"Error: Unable to summarize article. {str(e)}"

def summarize_news(input_path, output_path):
    try:
        logging.info(f"Reading news from {input_path}")
        with open(input_path, 'r') as f:
            articles = json.load(f)

        summarized_articles = []
        for article in articles:
            summary = summarize_article(article)
            summarized_articles.append({
                'title': article['title'],
                'link': article['link'],
                'author': article.get('author', 'Unknown'),
                'date': article.get('date', 'Unknown'),
                'summary': summary
            })

        # Save summaries to a new JSON file
        logging.info(f"Saving summarized news to {output_path}")
        with open(output_path, 'w') as f:
            json.dump(summarized_articles, f, indent=4)
        logging.info(f"Successfully saved {len(summarized_articles)} summarized articles")
    except Exception as e:
        logging.error(f"Error in summarize_news: {str(e)}")

if __name__ == '__main__':
    result_folder = os.getenv('TG_NEWS_RESULT_FOLDER')
    if result_folder is None:
        logging.warning("TG_NEWS_RESULT_FOLDER environment variable not set. Using default path.")
        result_folder = 'data'
    
    input_path = os.path.join(result_folder, "news.json")
    output_path = os.path.join(result_folder, "summarized_news.json")
    
    summarize_news(input_path, output_path)
    logging.info(f"News summarized and saved to: {output_path}")