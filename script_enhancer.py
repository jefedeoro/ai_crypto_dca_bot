import json
import logging
import re
from scrape.openai_client import client

def enhance_script(input_path, output_path):
    logging.info(f"Enhancing script from {input_path}")
    
    try:
        with open(input_path, 'r') as f:
            script = json.load(f)
        
        enhanced_script = []

        # Collect article titles for intro and outro
        article_titles = [section.get('title', '') for section in script if section.get('title', '')]

        # Process Intro
        logging.info("Processing intro segment...")
        intro_output = process_segment(
            segment_type="intro",
            content=None,  # No content needed for intro
            previous_dialogue=None,  # No previous dialogue
            article_titles=article_titles  # Pass article titles for listing
        )
        enhanced_script.extend(intro_output)

        # Process Each Article Individually
        for idx, section in enumerate(script):
            logging.info(f"Processing discussion segment for article {idx+1}...")
            article_content = section  # Contains 'title' and 'content'
            # Check if article content is sufficient
            if not article_content.get('content') or not article_content.get('title'):
                logging.info(f"Skipping article {idx+1} due to insufficient content.")
                continue
            previous_dialogue = enhanced_script[-5:] if len(enhanced_script) >=5 else enhanced_script  # Last few dialogues for context
            discussion_output = process_segment(
                segment_type="discussion",
                content=article_content,
                previous_dialogue=previous_dialogue
            )
            # Check if the assistant returned <skip></skip>
            if discussion_output == "<skip></skip>":
                logging.info(f"Assistant chose to skip article {idx+1} due to insufficient context.")
                continue
            enhanced_script.extend(discussion_output)
        
        # Process Ending
        logging.info("Processing ending segment...")
        ending_output = process_segment(
            segment_type="ending",
            content=None,  # No content needed for ending
            previous_dialogue=enhanced_script[-5:] if len(enhanced_script) >=5 else enhanced_script,  # Last few dialogues for context
            article_titles=article_titles  # Pass article titles for recap
        )
        enhanced_script.extend(ending_output)

        # Save the enhanced script as JSON
        with open(output_path, 'w') as f:
            json.dump(enhanced_script, f, indent=2)
        
        logging.info(f"Enhanced script saved to {output_path}")
        return True
    except Exception as e:
        logging.error(f"Error enhancing script: {str(e)}")
        return False

def process_segment(segment_type, content, previous_dialogue, article_titles=None):
    """
    Processes a segment (intro, discussion, ending) and returns the enhanced dialogue.
    """
    # Prepare the prompt based on the segment type
    if segment_type == "intro":
        user_prompt = generate_intro_prompt(article_titles)
    elif segment_type == "discussion":
        user_prompt = generate_discussion_prompt(content, previous_dialogue)
    elif segment_type == "ending":
        user_prompt = generate_ending_prompt(previous_dialogue, article_titles)
    else:
        raise ValueError("Invalid segment type.")

    # Send to GPT-4 for enhancement
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": get_system_prompt(segment_type)
            },
            {
                "role": "user",
                "content": user_prompt
            },
        ],
        max_tokens=1500,  # Adjusted for smaller segments
        temperature=0.7,
    )

    assistant_response = response.choices[0].message.content.strip()
    
    # Check for <skip></skip> response
    if assistant_response.strip() == "<skip></skip>":
        return "<skip></skip>"

    # Attempt to extract and parse the JSON array from the response
    try:
        # Ensure the assistant outputs only valid JSON
        enhanced_segment_json = json.loads(assistant_response)
    except Exception as e:
        logging.error(f"GPT-4 output is not valid JSON: {str(e)}")
        raise e  # Re-raise exception to be handled in the main function

    return enhanced_segment_json

def get_system_prompt(segment_type):
    # Update system prompt based on segment type
    base_prompt = """You are an AI assistant that transforms scripted content into natural, flowing conversations between four crypto enthusiasts discussing current news topics on the program "Crypto Current". Your goal is to create a realistic and engaging podcast-style dialogue that feels spontaneous and unscripted.

Instructions:

1. Transform the given script into a conversation between four characters:

- **Alex** (voice_id: **man2**): The host and moderator. Knowledgeable but always seeks others' opinions. Encourages open discussion.

- **Beth** (voice_id: **woman2**): The technical expert. Focuses on the technology behind cryptocurrencies. Explains complex concepts in simple terms.

- **Charlie** (voice_id: **man1**): The financial analyst. Provides insights on market trends and economic impacts. Connects the dots between news and financial implications.

- **Dana** (voice_id: **woman1**): The skeptic. Often plays devil's advocate and asks challenging questions. Brings alternative perspectives to the discussion.

2. **Guidelines for the conversation:**

- Start with a brief introduction by Alex (for the intro segment), including listing the topics to be discussed.

- For discussion segments, have the characters discuss the news topic in a natural and engaging way.

- Have the characters bring up the topics naturally, as if they've all read the articles beforehand.

- Encourage interactive discussion, with characters sharing their thoughts, insights, and questions.

- Use casual language, interjections, and reactions (e.g., "That's interesting," "Exactly," "I see your point").

- Allow the conversation to develop organically, including agreements and polite disagreements.

- Keep the tone friendly and engaging.

- Ensure all statements are informative and factually accurate.

- Balance the discussion by showing different perspectives on each topic.

- For the ending segment, have the characters recap the previous discussions and wrap up the conversation.

- **Avoid** phrases like "Here's a summary" or "Our next story is titled".

- **Do not** have one person read out summaries; instead, have the group discuss the articles.

- **Do not** mention unknown authors or dates; omit that information if it's unavailable.

- If there is insufficient context or content to discuss, output `<skip></skip>` and nothing else.

3. **Output Format:**
- ENGLISH 

- Spell out all numbers (e.g., "two" instead of "2").

- Prices just use 2 decimal places (e.g., $3.50).

- Output the result as a valid JSON array of objects.

- **Only output the JSON array. Do not include any other text before or after it. Do not enclose it in code blocks or quotes.**

- Each object must have 'text' and 'voice_id' fields, corresponding to the speaker's dialogue.

- For example:

  [
    {
      "text": "Hey everyone, welcome to another exciting episode of Crypto Chat! I'm your host, Alex, and today we've got some fascinating topics to discuss.",
      "voice_id": "man1"
    },
    {
      "text": "Absolutely, Alex! I can't wait to dive into the latest on Ethereum.",
      "voice_id": "woman1"
    },
    ...
  ]

- Ensure that the output is a properly formatted JSON array that can be parsed without errors."""

    return base_prompt

def generate_intro_prompt(article_titles):
    # Generate the intro prompt, including listing the topics
    topics_list = '\n'.join([f"- {title}" for title in article_titles if title])
    return f"""Please generate an introduction for the podcast as per the instructions. The introduction should be given by Alex, and the others can chime in briefly. Include a list of the topics to be discussed:

Topics:
{topics_list}
"""

def generate_discussion_prompt(article_content, previous_dialogue):
    # Optionally include previous dialogue for context
    previous_dialogue_text = ''
    if previous_dialogue:
        previous_dialogue_text = json.dumps(previous_dialogue, indent=2)

    article_title = article_content.get('title', '')
    article_body = ''
    for content in article_content.get('content', []):
        article_body += content.get('text', '') + '\n'

    return f"""Please transform the following article into a natural, flowing conversation between the four crypto enthusiasts as described in the instructions. Use the 'title' and 'content' of the article to inform the discussion. Have the characters discuss the topic, sharing their thoughts, insights, and questions. Make sure to keep it as a group discussion, not just one person reading summaries. **Do not copy the text verbatim**; instead, have the characters discuss the topic in their own words. If there is insufficient context or content to discuss, output `<skip></skip>` and nothing else. If information is unknown, do not mention it.

Previous dialogue for context (do not include in output):

{previous_dialogue_text}

Article to discuss:

Title: {article_title}

Content:
{article_body}
"""

def generate_ending_prompt(previous_dialogue, article_titles):
    # Generate the ending prompt, including recapping the topics discussed
    previous_dialogue_text = ''
    if previous_dialogue:
        previous_dialogue_text = json.dumps(previous_dialogue, indent=2)

    topics_list = '\n'.join([f"- {title}" for title in article_titles if title])

    return f"""Please generate a closing segment for the podcast as per the instructions. The ending should be given by Alex, and others can chime in. Recap the previous discussions and wrap up the conversation in a friendly and engaging manner.

Topics discussed:
{topics_list}

Previous dialogue for context (do not include in output):

{previous_dialogue_text}
"""

if __name__ == "__main__":
    input_path = "path/to/input/script.json"
    output_path = "path/to/output/enhanced_script.json"
    success = enhance_script(input_path, output_path)
    if success:
        print("Script enhancement completed successfully.")
        logging.info("Process completed successfully.")
    else:
        print("Script enhancement failed.")
        logging.error("Process failed.")
