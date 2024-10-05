import json
import logging
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
                    "content": (
                        "You are an AI assistant that transforms scripted content into natural, flowing conversations "
                        "between four crypto enthusiasts discussing current news topics. Your goal is to create a realistic "
                        "and engaging podcast-style dialogue that feels spontaneous and unscripted. The output should be "
                        "formatted as a JSON array of objects, where each object has 'text' and 'voice_id' fields. "
                        "The voice_ids are 'man1', 'man2', 'woman1', and 'woman2'."
                    ),
                },
                {
                    "role": "user",
                    "content": f"""
        Please transform the following script into a natural, flowing conversation between four crypto enthusiasts (Alex, Beth, Charlie, and Dana) discussing these news topics. Make it sound like a real, unscripted podcast discussion, with the following guidelines:

        1. **Alex** (voice_id: **man1**): The host and moderator. Knowledgeable but always seeks others' opinions. Encourages open discussion.
        2. **Beth** (voice_id: **woman1**): The technical expert. Focuses on the technology behind cryptocurrencies. Explains complex concepts in simple terms.
        3. **Charlie** (voice_id: **man2**): The financial analyst. Provides insights on market trends and economic impacts. Connects the dots between news and financial implications.
        4. **Dana** (voice_id: **woman2**): The skeptic. Often plays devil's advocate and asks challenging questions. Brings alternative perspectives to the discussion.

        **Guidelines for the conversation:**
        - Start with a brief introduction by Alex.
        - Ensure the dialogue flows naturally, with participants responding to each other's points.
        - Include casual language, interjections, and reactions (e.g., "That's interesting," "Exactly," "I see your point").
        - Allow the conversation to develop organically, including agreements and polite disagreements.
        - Keep the tone friendly and engaging.
        - Ensure all statements are informative and factually accurate.
        - Balance the discussion by showing different perspectives on each topic.
        - Avoid exaggeration, speculation, or unfounded claims.

        Please output the result as a JSON array of objects, where each object has 'text' and 'voice_id' fields, corresponding to the speaker's dialogue.

        Here's the script to transform:

        {script_content}
        """,
                },
            ],
            max_tokens=5000,
            temperature=0.7,
        )
        
        enhanced_script = response.choices[0].message.content.strip()
        
        # Attempt to parse the enhanced script as JSON
        try:
            enhanced_script_json = json.loads(enhanced_script)
        except json.JSONDecodeError:
            logging.error("GPT-4 output is not valid JSON. Falling back to original script.")
            enhanced_script_json = script

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