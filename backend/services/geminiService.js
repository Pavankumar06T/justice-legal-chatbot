import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    this.chatSessions = new Map();
  }

  // Initialize a new chat session
  startChat(chatId) {
    const chat = this.model.startChat({
      history: [
        {
          role: "user",
          parts: [{text: "You are a helpful legal assistant for the Justice Department. Provide accurate, clear information about legal processes, rights, and government services. Be empathetic but professional. Always clarify that you're an AI assistant and recommend consulting with a human lawyer for serious legal matters."}],
        },
        {
          role: "model",
          parts: [{text: "I understand. I will serve as a helpful legal assistant for the Justice Department, providing accurate information while maintaining professionalism and clearly stating my limitations as an AI system."}],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });
    
    this.chatSessions.set(chatId, chat);
    return chat;
  }

  // Send message to Gemini AI
  async sendMessage(chatId, message) {
    try {
      let chat = this.chatSessions.get(chatId);
      
      if (!chat) {
        chat = this.startChat(chatId);
      }
      
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      
      return { success: true, message: text };
    } catch (error) {
      console.error('Error communicating with Gemini API:', error);
      return { 
        success: false, 
        message: "I'm experiencing technical difficulties. Please try again later." 
      };
    }
  }

  // Get legal resources based on query
  async getLegalResources(query) {
    try {
      const prompt = `Based on the legal query: "${query}", provide specific legal resources, relevant government departments, official websites, and contact information that could help. Format the response as a JSON object with categories like "government_agencies", "legal_aid_organizations", "online_resources", and "next_steps".`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON if possible, otherwise return as text
      try {
        return JSON.parse(text);
      } catch (e) {
        return { resources: text };
      }
    } catch (error) {
      console.error('Error getting legal resources:', error);
      return { error: "Unable to fetch legal resources at this time." };
    }
  }

  // End a chat session
  endChat(chatId) {
    this.chatSessions.delete(chatId);
    return { success: true, message: "Chat session ended" };
  }
}

export default new GeminiService();
