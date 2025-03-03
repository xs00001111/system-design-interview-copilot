import OpenAI from 'openai';

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
      // Convert the audio blob to a File object if it's not already one
      let fileToSend;
      if (audioFile instanceof Blob && !(audioFile instanceof File)) {
        // Create a File from the Blob with a proper name and type
        fileToSend = new File([audioFile], 'audio.webm', { type: audioFile.type || 'audio/webm' });
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
      const recentChunks = this.transcriptionBuffer.slice(-3); // Process last 3 chunks
      const audioBlob = new Blob(recentChunks, { type: 'audio/webm' });
      
      // Transcribe the recent audio
      const transcription = await this.transcribeAudio(audioBlob);
      
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