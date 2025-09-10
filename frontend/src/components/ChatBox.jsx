import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./ChatBox.css";

// Icons (you can use react-icons or SVG)
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6H5L3 7V9L5 10V15C5 16.1 5.9 17 7 17V21H9V18H15V21H17V17C18.1 17 19 16.1 19 15V10L21 9ZM17 15C17 15.55 16.55 16 16 16H8C7.45 16 7 15.55 7 15V10H17V15Z" fill="currentColor"/>
  </svg>
);

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const getApiUrl = () => process.env.REACT_APP_API_URL || "http://localhost:8000";

const initBotMsg = () => ({
  id: Date.now().toString(),
  sender: "bot",
  text: "Hello! I'm your Justice Department assistant. How can I help you today?",
  timestamp: new Date()
});

const createSession = () => ({
  session_id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
  label: "New Chat " + new Date().toLocaleTimeString(),
  created: new Date()
});

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initBotMsg()]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([createSession()]);
  const [currentSessionId, setCurrentSessionId] = useState(sessions[0].session_id);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([initBotMsg()]);
  }, [currentSessionId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { 
      id: Date.now().toString(), 
      sender: "user", 
      text: input,
      timestamp: new Date()
    };
    
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${getApiUrl()}/chat`,
        { user_message: input, session_id: currentSessionId }
      );
      
      const botMsg = { 
        id: Date.now().toString(), 
        sender: "bot", 
        text: response.data.bot_response,
        timestamp: new Date()
      };
      
      setMessages((msgs) => [...msgs, botMsg]);
    } catch (err) {
      const errorMsg = { 
        id: Date.now().toString(), 
        sender: "bot", 
        text: "Sorry, I'm experiencing connection issues. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      
      setMessages((msgs) => [...msgs, errorMsg]);
    }
    setLoading(false);
  };

  const handleSelectSession = (sid) => {
    setCurrentSessionId(sid);
    setMessages([initBotMsg()]);
  };

  const handleNewChat = () => {
    const newSession = createSession();
    setSessions((s) => [...s, newSession]);
    setCurrentSessionId(newSession.session_id);
    setMessages([initBotMsg()]);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chatbox-wrapper">
      <Sidebar
        sessions={sessions}
        currentSession={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />
      
      <div className="chatbox-container">
        <div className="chatbox-header">
          <div className="chatbox-header-info">
            <h2>Justice Department Assistant</h2>
            <p>Ask me anything about justice department services and information</p>
          </div>
          <div className="chatbox-header-actions">
            <button className="header-btn">⋮</button>
          </div>
        </div>
        
        <div className="chatbox-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chatbox-message-row ${msg.sender}`}>
              <div className="chatbox-message-avatar">
                {msg.sender === "user" ? <UserIcon /> : <BotIcon />}
              </div>
              <div className={`chatbox-message-content ${msg.sender}`}>
                <div className="chatbox-message-bubble">
                  <span className="chatbox-message-text">{msg.text}</span>
                  <span className="chatbox-message-time">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                {msg.isError && (
                  <div className="chatbox-message-error">
                    Connection error
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="chatbox-message-row bot">
              <div className="chatbox-message-avatar">
                <BotIcon />
              </div>
              <div className="chatbox-message-content bot">
                <div className="chatbox-message-bubble typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chatbox-input-container">
          <div className="chatbox-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
              className="chatbox-input"
              disabled={loading}
              placeholder="Type your message..."
            />
            <button 
              onClick={handleSend} 
              disabled={loading || !input.trim()} 
              className="chatbox-send-btn"
            >
              <SendIcon />
            </button>
          </div>
          <div className="chatbox-input-hint">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;