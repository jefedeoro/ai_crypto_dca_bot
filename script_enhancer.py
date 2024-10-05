import json
import logging
import re
from scrape.openai_client import client

def enhance_script(input_path, output_path):
    logging.info(f"Enhancing script from {input_path}")
    
    try:
        with open(input_path, 'r') as f:
            script = json.load(f)
        
        # Prepare the script content for GPT-4
        script_content = json.dumps(script, indent=2)
        
        # Send to GPT-4 for enhancement
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": """You are an AI assistant that transforms scripted content into natural, flowing conversations between four crypto enthusiasts discussing current news topics. Your goal is to create a realistic and engaging podcast-style dialogue that feels spontaneous and unscripted.

Instructions:

1. Transform the given script into a conversation between four characters:

- **Alex** (voice_id: **man1**): The host and moderator. Knowledgeable but always seeks others' opinions. Encourages open discussion.

- **Beth** (voice_id: **woman1**): The technical expert. Focuses on the technology behind cryptocurrencies. Explains complex concepts in simple terms.

- **Charlie** (voice_id: **man2**): The financial analyst. Provides insights on market trends and economic impacts. Connects the dots between news and financial implications.

- **Dana** (voice_id: **woman2**): The skeptic. Often plays devil's advocate and asks challenging questions. Brings alternative perspectives to the discussion.

2. **Guidelines for the conversation:**

- Start with a brief introduction by Alex.

- For each news topic in the script, have the characters discuss it in a natural and engaging way.

- Have the characters bring up the topics naturally, as if they've all read the articles beforehand.

- Encourage interactive discussion, with characters sharing their opinions, asking questions, and responding to each other's points.

- Use casual language, interjections, and reactions (e.g., "That's interesting," "Exactly," "I see your point").

- Allow the conversation to develop organically, including agreements and polite disagreements.

- Keep the tone friendly and engaging.

- Ensure all statements are informative and factually accurate.

- Balance the discussion by showing different perspectives on each topic.

- **Avoid** phrases like "Here's a summary" or "Our next story is titled".

- **Do not** have one person read out summaries; instead, have the group discuss the articles.

- **Do not** mention unknown authors or dates; omit that information if it's unavailable.

3. **Output Format:**

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
                },
                {
                    "role": "user",
                    "content": f"""Please transform the following script into a natural, flowing conversation between the four crypto enthusiasts as described in the instructions. The script contains news topics with some details. Use the 'title' and 'content' of each news item to inform the conversation. Have the characters discuss each topic, sharing their thoughts, insights, and questions. Make sure to keep it as a group discussion, not just one person reading summaries. **Do not copy the text verbatim**; instead, have the characters discuss the topics in their own words. If information is unknown, do not mention it. Here's the script to transform:

{script_content}"""
                },
            ],
            max_tokens=5000,
            temperature=0.7,
        )

        enhanced_script = response.choices[0].message.content.strip()
        
        # Attempt to extract and parse the JSON array from the response
        try:
            # Use regular expressions to find the JSON array in the response
            json_array_match = re.search(r'(\[\s*\{.*?\}\s*\])', enhanced_script, re.DOTALL)
            if json_array_match:
                json_array_text = json_array_match.group(1)
                enhanced_script_json = json.loads(json_array_text)
            else:
                logging.error("Could not find JSON array in GPT-4 output.")
                raise ValueError("No JSON array found in GPT-4 output.")
        except Exception as e:
            logging.error(f"GPT-4 output is not valid JSON: {str(e)}")
            logging.error("Falling back to original script with formatting.")
            enhanced_script_json = []
            for section in script:
                for content in section['content']:
                    enhanced_script_json.append({
                        'text': content['text'],
                        'voice_id': content['speaker']
                    })

        # Save the enhanced script as JSON
        with open(output_path, 'w') as f:
            json.dump(enhanced_script_json, f, indent=2)
        
        logging.info(f"Enhanced script saved to {output_path}")
        return True
    except Exception as e:
        logging.error(f"Error enhancing script: {str(e)}")
        return False

if __name__ == "__main__":
    input_path = "path/to/input/script.json"
    output_path = "path/to/output/enhanced_script.json"
    success = enhance_script(input_path, output_path)
    if success:
        print("Script enhancement completed successfully.")
    else:
        print("Script enhancement failed.")
