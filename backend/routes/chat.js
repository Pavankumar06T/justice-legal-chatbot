import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import geminiService from '../services/geminiService.js';

// Store chat sessions in memory (in production, use a database)
const chatSessions = new Map();

// Start a new chat session
router.post('/start', (req, res) => {
  try {
    const chatId = uuidv4();
    const { initialMessage } = req.body;
    
    // Initialize chat session
    chatSessions.set(chatId, {
      id: chatId,
      createdAt: new Date(),
      history: []
    });
    
    // If there's an initial message, process it
    if (initialMessage) {
      geminiService.sendMessage(chatId, initialMessage)
        .then(response => {
          // Add to history
          const session = chatSessions.get(chatId);
          session.history.push(
            { role: 'user', content: initialMessage, timestamp: new Date() },
            { role: 'assistant', content: response.message, timestamp: new Date() }
          );
          
          res.json({
            chatId,
            response: response.message,
            history: session.history
          });
        })
        .catch(error => {
          res.status(500).json({ error: 'Failed to process initial message' });
        });
    } else {
      res.json({
        chatId,
        response: "Hello! I'm your Justice Department assistant. How can I help you today?",
        history: []
      });
    }
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ error: 'Failed to start chat session' });
  }
});

// Send a message to the chatbot
router.post('/message', async (req, res) => {
  try {
    const { chatId, message } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json({ error: 'Chat ID and message are required' });
    }
    
    // Verify chat session exists
    if (!chatSessions.has(chatId)) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    // Get response from Gemini
    const response = await geminiService.sendMessage(chatId, message);
    
    if (response.success) {
      // Update chat history
      const session = chatSessions.get(chatId);
      session.history.push(
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response.message, timestamp: new Date() }
      );
      
      // Keep only the last 20 messages to prevent memory issues
      if (session.history.length > 20) {
        session.history = session.history.slice(-20);
      }
      
      res.json({
        response: response.message,
        history: session.history
      });
    } else {
      res.status(500).json({ error: response.message });
    }
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get legal resources based on query
router.post('/resources', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const resources = await geminiService.getLegalResources(query);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching legal resources:', error);
    res.status(500).json({ error: 'Failed to fetch legal resources' });
  }
});

// Get chat history
router.get('/history/:chatId', (req, res) => {
  try {
    const { chatId } = req.params;
    
    if (!chatSessions.has(chatId)) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    const session = chatSessions.get(chatId);
    res.json({ history: session.history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// End a chat session
router.post('/end', (req, res) => {
  try {
    const { chatId } = req.body;
    
    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }
    
    if (chatSessions.has(chatId)) {
      chatSessions.delete(chatId);
      geminiService.endChat(chatId);
    }
    
    res.json({ message: 'Chat session ended successfully' });
  } catch (error) {
    console.error('Error ending chat session:', error);
    res.status(500).json({ error: 'Failed to end chat session' });
  }
});

export default router;
