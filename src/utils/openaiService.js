import OpenAI from 'openai';

// Helper function to determine file extension based on MIME type
const getFileExtensionFromMimeType = (mimeType) => {
  if (!mimeType) return 'webm';
  const mapping = {
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/m4a': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/flac': 'flac',
    'audio/webm;codecs=opus': 'webm'
  };
  return mapping[mimeType] || 'webm';
};

/**
 * OpenAI Service utility for handling both text and audio transcription
 * using the same API key
 */
class OpenAIService {
  constructor(apiKey) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    this.transcriptionBuffer = [];
    this.onTranscriptionUpdate = null;
  }

  /**
   * Transcribe audio using Whisper model
   * @param {File|Blob} audioFile - The audio file to transcribe
   * @returns {Promise<string>} - The transcribed text
   */
  async transcribeAudio(audioFile) {
    try {
      // Convert the audio blob to a File object if it's not already one.
      // Use the blob’s MIME type to set a matching file extension.
      let fileToSend;
      if (audioFile instanceof Blob && !(audioFile instanceof File)) {
        const extension = getFileExtensionFromMimeType(audioFile.type);
        fileToSend = new File([audioFile], `audio.${extension}`, { type: audioFile.type || 'audio/webm' });
      } else {
        fileToSend = audioFile;
      }

      const transcription = await this.openai.audio.transcriptions.create({
        file: fileToSend,
        model: 'whisper-1',
      });

      return transcription.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }
  
  /**
   * Set up real-time transcription callback
   * @param {Function} callback - Function to call with updated transcription
   */
  setTranscriptionCallback(callback) {
    this.onTranscriptionUpdate = callback;
  }

  /**
   * Process audio chunk in real-time
   * @param {Blob} audioChunk - Audio chunk to process
   */
  async processAudioChunk(audioChunk) {
    try {
      // Add chunk to buffer
      this.transcriptionBuffer.push(audioChunk);
      
      // Create a blob from the last few chunks (adjust buffer size as needed)
      const recentChunks = this.transcriptionBuffer.slice(-8); // Process last 8 chunks
      // Use the MIME type of the incoming chunk
      const audioBlob = new Blob(recentChunks, { type: audioChunk.type });
      
      // Transcribe the recent audio
      console.log('Starting audio transcription at:', new Date().toISOString());
const transcription = await this.transcribeAudio(audioBlob);
console.log('Completed transcription at:', new Date().toISOString(), 'Content:', transcription);
      
      // Clear the transcription buffer to start fresh next time
      
      // Call the update callback if set
      if (this.onTranscriptionUpdate) {
        this.onTranscriptionUpdate(transcription);
      }
      
      return transcription;
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      throw error;
    }
  }

  /**
   * Clear the transcription buffer
   */
  clearTranscriptionBuffer() {
    this.transcriptionBuffer = [];
  }

  /**
   * Generate text using GPT model
   * @param {string} prompt - The prompt for text generation
   * @param {string} model - The model to use (e.g., 'gpt-4', 'gpt-3.5-turbo')
   * @returns {Promise<string>} - The generated text
   */
  async generateText(prompt, model = 'gpt-4') {
    try {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }

  /**
   * Process interview audio and generate suggestions
   * @param {File|Blob} audioFile - The audio file of the interview
   * @param {string} textModel - The text model to use for suggestions
   * @returns {Promise<Object>} - Object containing transcription and suggestions
   */
  async processInterviewAudio(audioFile, textModel = 'gpt-4') {
    try {
      // First transcribe the audio
      const transcription = await this.transcribeAudio(audioFile);
      
      // Then generate suggestions based on the transcription
      const prompt = `This is a system design interview transcript. Please provide helpful suggestions:\n${transcription}`;
      const suggestions = await this.generateText(prompt, textModel);
      
      return {
        transcription,
        suggestions
      };
    } catch (error) {
      console.error('Error processing interview audio:', error);
      throw error;
    }
  }
}

export default OpenAIService;
