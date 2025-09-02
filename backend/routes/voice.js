import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import speechToTextService from '../services/speechToTextService.js';
import geminiService from '../services/geminiService.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if the file is an audio file
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Process audio message
router.post('/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    const { chatId } = req.body;
    
    // Transcribe audio
    const transcriptionResult = await speechToTextService.processAudioFile(req.file.path);
    
    if (!transcriptionResult.success) {
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }
    
    const transcribedText = transcriptionResult.text;
    
    if (!transcribedText || transcribedText.trim() === '') {
      return res.json({ 
        text: '', 
        response: "I didn't catch that. Could you please repeat or type your question?" 
      });
    }
    
    // Get response from Gemini
    let geminiResponse;
    if (chatId) {
      geminiResponse = await geminiService.sendMessage(chatId, transcribedText);
    } else {
      // If no chatId, create a temporary response
      const tempResponse = await geminiService.sendMessage('temp-' + uuidv4(), transcribedText);
      geminiResponse = tempResponse;
    }
    
    if (!geminiResponse.success) {
      return res.status(500).json({ error: 'Failed to get AI response' });
    }
    
    // Generate speech from response (optional)
    // const speechResponse = await speechToTextService.generateSpeech(geminiResponse.message);
    
    res.json({
      text: transcribedText,
      response: geminiResponse.message,
      // audio: speechResponse.success ? speechResponse.audio : null
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

// Transcribe audio only (without AI response)
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    const transcriptionResult = await speechToTextService.processAudioFile(req.file.path);
    
    if (!transcriptionResult.success) {
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }
    
    res.json({ text: transcriptionResult.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

export default router;
