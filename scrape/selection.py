# selection.py

import logging
import re
from .openai_client import client
from .config import MAX_STORIES

def select_best_headlines(headlines, max_articles=MAX_STORIES):
    """Use OpenAI API to select the best headlines."""
    print(f"Starting headline selection process. Total headlines: {len(headlines)}")
    try:
        logging.info("Selecting best headlines using GPT-4o-mini")
        print("Preparing request for GPT-4o-mini")
        
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert news curator specializing in cryptocurrency and blockchain technology. "
                    "Your task is to select the most relevant and interesting news articles based on their titles. "
                    "Focus on providing a good variety of current news, with a strong emphasis on topics related to NEAR and NEAR Protocol. "
                    "When selecting articles, consider the following criteria:\n"
                    "- **Relevance**: Prioritize articles directly related to NEAR, NEAR Protocol, or significant events in the crypto space.\n"
                    "- **Recency**: Prefer more recent news articles to ensure the content is up-to-date.\n"
                    "- **Variety**: Ensure a diverse range of topics to cover different aspects of the news.\n"
                    "- **Impact**: Choose articles that have significant implications for the industry or the public.\n"
                    "Respond with the nonce numbers of the selected articles in a comma-separated list, enclosed in `<story-nonce>` tags."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Please select the nonces of the best {max_articles} headlines from the list below. "
                    f"Prioritize articles about NEAR and NEAR Protocol, but include other significant news to provide variety. "
                    "Here are the headlines:\n\n"
                    + "\n".join(
                            [f"{headline['nonce']}: ({headline['date']}) {headline['title']}" for headline in headlines]
                    )
                ),
            },
        ]

        
        print("Sending request to OpenAI API")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
        )
        
        print("Received response from OpenAI API")
        content = response.choices[0].message.content.strip()
        print(f"Raw API response: {content}")
        
        # Extract nonces from the response
        match = re.search(r'<story-nonce>(.*?)</story-nonce>', content, re.DOTALL)
        if match:
            nonce_list = match.group(1).strip()
            selected_nonces = [nonce.strip() for nonce in nonce_list.split(',') if nonce.strip().isdigit()]
        else:
            print("No <story-nonce> tags found in the response. Using fallback selection.")
            selected_nonces = [headline['nonce'] for headline in headlines[:max_articles]]
        
        print(f"Processed selected nonces: {selected_nonces}")
        
        logging.info(f"Selected {len(selected_nonces)} headlines for scraping")
        print(f"Selected {len(selected_nonces)} headlines for scraping")
        
        return selected_nonces
    except Exception as e:
        print(f"Error in headline selection: {str(e)}")
        logging.error(f"Error selecting best headlines: {str(e)}", exc_info=True)
        print("Using fallback selection method")
        fallback_selection = [headline['nonce'] for headline in headlines[:max_articles]]
        print(f"Fallback selection: {fallback_selection}")
        return fallback_selection  # Fallback

if __name__ == "__main__":
    # Test the function with some sample data
    sample_headlines = [
        {"nonce": "00001", "title": "NEAR Protocol Announces Major Upgrade"},
        {"nonce": "00002", "title": "Bitcoin Reaches New All-Time High"},
        {"nonce": "00003", "title": "Ethereum 2.0 Staking Surpasses $20 Billion"},
        {"nonce": "00004", "title": "NEAR Foundation Launches $800M Developer Fund"},
        {"nonce": "00005", "title": "Cryptocurrency Market Cap Exceeds $2 Trillion"},
    ]
    
    selected = select_best_headlines(sample_headlines, max_articles=3)
    print(f"Selected headlines: {selected}")
