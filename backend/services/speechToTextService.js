// services/speechToTextService.js - SIMPLIFIED
class SpeechToTextService {
  constructor() {
    console.log('Speech-to-Text service initialized (browser-based)');
  }

  // This is just a fallback - most processing will be in the browser
  async processAudioFile(filePath) {
    return { 
      success: false, 
      error: 'Browser-based voice recognition is used instead. Please use the frontend voice interface.' 
    };
  }
}

export default new SpeechToTextService();