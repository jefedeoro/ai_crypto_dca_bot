import os
import logging
import datetime
import uuid
from scrape import scraping
from news_summarizer import summarize_news
from script_writer import write_script
from script_enhancer import enhance_script
import text_to_speech_edit

# Set up logging
log_file = 'debug.log'
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.FileHandler(log_file), logging.StreamHandler()])

def create_result_folder():
    nonce = uuid.uuid4().hex[:8]
    current_time = datetime.datetime.now().strftime("%Y%m%d-%H_%M_%S")
    folder_name = f"data/{current_time}_{nonce}"
    os.makedirs(folder_name, exist_ok=True)
    logging.info(f"Created result folder: {folder_name}")
    return folder_name

def main():
    try:
        logging.info("Starting main process...")
        result_folder = create_result_folder()
        os.environ['TG_NEWS_RESULT_FOLDER'] = result_folder
        logging.info(f"Set TG_NEWS_RESULT_FOLDER environment variable to: {result_folder}")

        # Step 1: Scrape headlines
        headlines_path = os.path.join(result_folder, "headlines.json")
        scraping.scrape_headlines(headlines_path)

        # Step 2: Select and scrape full stories
        selected_path = os.path.join(result_folder, "selected_headlines.json")
        news_json_path = os.path.join(result_folder, "news.json")
        scraping.select_and_scrape_stories(headlines_path, selected_path, news_json_path)

        # Step 3: Summarize news
        summarized_news_json_path = os.path.join(result_folder, "summarized_news.json")
        summarize_news(news_json_path, summarized_news_json_path)

        # Step 4: Write script
        script_json_path = os.path.join(result_folder, "script.json")
        write_script(summarized_news_json_path, script_json_path)

        # Step 5: Enhance script
        enhanced_script_path = os.path.join(result_folder, "enhanced_script.json")
        logging.info(f"Enhancing script from {script_json_path} to {enhanced_script_path}")
        enhance_success = enhance_script(script_json_path, enhanced_script_path)
        
        if enhance_success and os.path.exists(enhanced_script_path):
            logging.info("Script enhancement completed successfully.")
            logging.debug(f"Enhanced script saved to: {enhanced_script_path}")
        else:
            logging.error("Script enhancement failed or file not found. Using original script.")
            enhanced_script_path = script_json_path

        # Step 6: Text-to-speech conversion
        output_audio_path = os.path.join(result_folder, "output_audio.mp3")
        logging.info(f"Starting text-to-speech conversion from {enhanced_script_path} to {output_audio_path}")
        tts_success = text_to_speech_edit.text_to_speech(enhanced_script_path, output_audio_path)

        if tts_success:
            logging.info("Text-to-speech conversion completed successfully.")
        else:
            logging.error("Text-to-speech conversion failed.")

        logging.info(f"Process completed. Results stored in: {result_folder}")
        return tts_success, result_folder
        
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}", exc_info=True)
        return False, None

if __name__ == '__main__':
    main()
    logging.info(f"Log file created at: {os.path.abspath(log_file)}")