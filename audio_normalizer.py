import logging
from pydub import AudioSegment

def normalize_audio(input_audio_path, output_audio_path, target_dBFS=-2.0):
    """
    Normalizes the audio file to the target dBFS.

    Parameters:
    - input_audio_path: Path to the input audio file.
    - output_audio_path: Path to save the normalized audio file.
    - target_dBFS: The desired peak dBFS level (default is -3.0 dBFS).

    Returns:
    - True if successful, False otherwise.
    """
    logging.info(f"Normalizing audio file: {input_audio_path}")
    try:
        # Load the audio file
        audio = AudioSegment.from_file(input_audio_path)
        
        # Calculate difference between target dBFS and current dBFS
        change_in_dBFS = target_dBFS - audio.max_dBFS
        
        # Apply gain to normalize the audio
        normalized_audio = audio.apply_gain(change_in_dBFS)
        
        # Export the normalized audio
        normalized_audio.export(output_audio_path, format='mp3')  # Adjust format if needed
        
        logging.info(f"Normalized audio saved to: {output_audio_path}")
        return True
    except Exception as e:
        logging.error(f"Error normalizing audio: {str(e)}")
        return False

if __name__ == "__main__":
    # Example usage
    input_audio_path = "path/to/input_audio.mp3"
    output_audio_path = "path/to/output_normalized_audio.mp3"
    success = normalize_audio(input_audio_path, output_audio_path)
    if success:
        print("Audio normalization completed successfully.")
    else:
        print("Audio normalization failed.")
