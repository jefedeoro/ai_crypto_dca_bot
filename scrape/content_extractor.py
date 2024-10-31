import logging
import requests
from bs4 import BeautifulSoup
import re

def clean_html_content(html):
    """Clean HTML content and convert to markdown-like format."""
    try:
        # Create BeautifulSoup object
        soup = BeautifulSoup(html, 'html.parser')

        # Remove unwanted elements
        for element in soup.find_all(['script', 'style', 'nav', 'header', 'footer', 
                                    'iframe', 'noscript', 'meta', 'link', 'button']):
            element.decompose()

        # Remove all class and id attributes
        for tag in soup.find_all(True):
            tag.attrs = {}

        # Extract title
        title = ""
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip()
            title_tag.decompose()

        # Find main content area (common content containers)
        content_tags = ['article', 'main', 'div[role="main"]', '.content', '.post', '.article']
        main_content = None
        
        for tag in content_tags:
            main_content = soup.select_one(tag)
            if main_content:
                break

        if not main_content:
            # If no main content container found, use body
            main_content = soup.body

        if not main_content:
            return None

        # Get text content
        text = main_content.get_text('\n', strip=True)

        # Clean up the text
        # Remove multiple newlines
        text = re.sub(r'\n\s*\n', '\n\n', text)
        # Remove multiple spaces
        text = re.sub(r' +', ' ', text)

        # Format as markdown
        markdown = f"# {title}\n\n{text}" if title else text

        return markdown

    except Exception as e:
        logging.error(f"Error cleaning HTML content: {str(e)}")
        return None

def get_article_content(url):
    """
    Fetch article content from URL and extract clean content.
    """
    try:
        # Fetch article content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        # Extract clean content
        cleaned_content = clean_html_content(response.text)
        
        if cleaned_content:
            return cleaned_content
        else:
            logging.error(f"Failed to extract clean content from {url}")
            return None

    except Exception as e:
        logging.error(f"Error fetching article content from {url}: {str(e)}")
        return None
