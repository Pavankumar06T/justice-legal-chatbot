import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";
import Sidebar from "./Sidebar";
import ResourceModal from "./ResourceModal";
import "./ChatBox.css";

// Custom Icons with Justice Theme
const SendIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GlobeIcon = () => (
  <div style={{ marginRight: '8px' }}>
    <svg width="24" height="24" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const JusticeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 10V6L18 2L22 6V10H14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 14V18L6 22L2 18V14H10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 14H22V18L18 22L14 18V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 10H2V6L6 2L10 6V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M20 19C20 16.2386 16.4183 14 12 14C7.58172 14 4 16.2386 4 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
  label: "New Chat",
  created: new Date()
});

// Indian languages with their codes and display names
const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' }
];

const ChatBox = () => {
  const { logout } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initBotMsg()]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [activeResource, setActiveResource] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "What are my rights?",
    "How do I file a complaint?",
    "What legal documents do I need?",
    "How to find a lawyer?"
  ]);
  
  const messagesEndRef = useRef(null);
  const languageDropdownRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Apply theme to body
    if (isDarkTheme) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [isDarkTheme]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load sessions from backend on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get(`/sessions`);
        const sessionsData = response.data;
        
        setSessions(sessionsData);
        
        // Don't automatically select the first session
        // Instead, show the welcome screen
        if (sessionsData.length > 0) {
          setCurrentSessionId(null); // This will show welcome screen
        } else {
          // Create a new session if none exist
          handleNewChat();
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setCurrentSessionId(null); // Show welcome screen on error
      }
    };
    
    fetchSessions();
  }, []);

  // Load messages for current session
  useEffect(() => {
    const fetchSessionHistory = async () => {
      if (!currentSessionId) {
        // Show welcome screen when no session is selected
        setMessages([initBotMsg()]);
        return;
      }
      
      try {
        const response = await api.get(`${getApiUrl()}/sessions/${currentSessionId}/history`);
        const sessionData = response.data;
        
        if (sessionData.history && sessionData.history.length > 0) {
          // Convert history to message format
          const historyMessages = sessionData.history.flatMap(item => [
            { 
              id: `${item.timestamp}-user`, 
              sender: "user", 
              text: item.user_message,
              timestamp: new Date(item.timestamp),
              language: item.language
            },
            { 
              id: `${item.timestamp}-bot`, 
              sender: "bot", 
              text: item.bot_response,
              timestamp: new Date(item.timestamp),
              language: item.language
            }
          ]);
          
          setMessages(historyMessages);
        } else {
          setMessages([initBotMsg()]);
        }
      } catch (error) {
        console.error("Error fetching session history:", error);
        setMessages([initBotMsg()]);
      }
    };
    
    if (currentSessionId) {
      fetchSessionHistory();
    }
  }, [currentSessionId]);

  const handleSend = async (message = null) => {
    const messageText = message || input.trim();
    if (!messageText) return;
    
    const userMsg = { 
      id: Date.now().toString(), 
      sender: "user", 
      text: messageText,
      timestamp: new Date(),
      language: selectedLanguage
    };
    
    // Update messages immediately for better UX
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
    try {
      const response = await api.post(
        `${getApiUrl()}/chat`,
        { 
          user_message: messageText, 
          session_id: currentSessionId,
          language: selectedLanguage // Send selected language to backend
        }
      );
      
      const botMsg = { 
        id: Date.now().toString(), 
        sender: "bot", 
        text: response.data.bot_response,
        timestamp: new Date(),
        language: selectedLanguage
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      // Refresh sessions to update the labels
      const sessionsResponse = await api.get(`${getApiUrl()}/sessions`);
      setSessions(sessionsResponse.data);
      
      // Set current session ID if it wasn't set before
      if (!currentSessionId) {
        setCurrentSessionId(response.data.session_id);
      }
    } catch (err) {
      const errorMsg = { 
        id: Date.now().toString(), 
        sender: "bot", 
        text: "Sorry, I'm experiencing connection issues. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMsg]);
    }
    setLoading(false);
  };

  const handleSelectSession = async (sid) => {
    setCurrentSessionId(sid);
    setIsSidebarOpen(false);
  };

  const handleNewChat = async () => {
    try {
      // Use the /new_chat endpoint to create a session without sending a message
      const response = await api.post(
        `${getApiUrl()}/chat`,
        { 
          user_message: "/new_chat", 
          session_id: null, 
          language: selectedLanguage 
        }
      );
      
      // Refresh sessions list
      const sessionsResponse = await api.get(`${getApiUrl()}/sessions`);
      setSessions(sessionsResponse.data);
      
      // Set the new session as current
      setCurrentSessionId(response.data.session_id);
      setMessages([initBotMsg()]); // Reset to welcome message
    } catch (error) {
      console.error("Error creating new chat:", error);
      // Fallback: create a local session
      const newSession = createSession();
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.session_id);
      setMessages([initBotMsg()]);
    }
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation(); // Prevent triggering the select session event
    
    if (sessions.length <= 1) {
      // Don't allow deleting the last session
      alert("You need to have at least one conversation.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this conversation?")) {
      return;
    }
    
    try {
      await api.delete(`${getApiUrl()}/sessions/${sessionId}`);
      
      // Refresh sessions list
      const sessionsResponse = await api.get(`${getApiUrl()}/sessions`);
      setSessions(sessionsResponse.data);
      
      // If the deleted session was the current one, switch to welcome screen
      if (sessionId === currentSessionId) {
        setCurrentSessionId(null);
        setMessages([initBotMsg()]);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete conversation. Please try again.");
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleResourceClick = (resource) => {
    setActiveResource(resource);
    // Close sidebar on mobile
    if (window.innerWidth < 968) {
      setIsSidebarOpen(false);
    }
  };

  const closeResourceModal = () => {
    setActiveResource(null);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setShowLanguageDropdown(false);
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const getCurrentLanguage = () => {
    return INDIAN_LANGUAGES.find(lang => lang.code === selectedLanguage) || INDIAN_LANGUAGES[0];
  };

  // Function to render HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };
   
  const handleLogout = () => {
        logout(); // This will clear the token and the ProtectedRoute will redirect
  };

  return (
    <div className="chatbox-wrapper">
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
           onClick={closeSidebar}></div>
      
      <Sidebar
        sessions={sessions}
        currentSession={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onResourceClick={handleResourceClick}
        onLogout={handleLogout}
      />
      
      <div className="chatbox-container">
        <div className="chatbox-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <div className="chatbox-header-info">
            <div className="header-icon">
              <JusticeIcon />
            </div>
            <div>
              <h2>Justice Assistant</h2>
              <p>Your guide to legal information & resources</p>
            </div>
          </div>
          
          <div className="chatbox-header-actions">
            <div className="language-selector-container">
              <button 
                className="header-btn language-toggle" 
                onClick={toggleLanguageDropdown}
                title="Select language"
              >
                <GlobeIcon />
                <span>{getCurrentLanguage().code.toUpperCase()}</span>
              </button>
              
              {showLanguageDropdown && (
                <div className="language-dropdown" ref={languageDropdownRef}>
                  <div className="language-dropdown-header">
                    <span>Select Language</span>
                  </div>
                  <div className="language-list">
                    {INDIAN_LANGUAGES.map((language) => (
                      <div
                        key={language.code}
                        className={`language-option ${selectedLanguage === language.code ? 'selected' : ''}`}
                        onClick={() => handleLanguageSelect(language.code)}
                      >
                        <span className="language-name">{language.name}</span>
                        <span className="language-native">{language.nativeName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button className="header-btn theme-toggle" onClick={toggleTheme}>
              {isDarkTheme ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        <div className="chatbox-messages">
          {(!currentSessionId || messages.length <= 1) && (
            <div className="welcome-message">
              <div className="welcome-icon">⚖️</div>
              <h3>Justice Department Assistant</h3>
              <p>Ask me about legal procedures, rights, or department services</p>
              <div className="suggestions-container">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-bubble"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`chatbox-message-row ${msg.sender}`}>
              <div className="chatbox-message-avatar">
                {msg.sender === "user" ? <UserIcon /> : <JusticeIcon />}
              </div>
              <div className={`chatbox-message-content ${msg.sender}`}>
                <div className="chatbox-message-bubble">
                  <div className="chatbox-message-text" dangerouslySetInnerHTML={createMarkup(
                    msg.text.split("\n").map(line => line.trim() ? line : '<br/>').join('')
                  )} />
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
                <JusticeIcon />
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
            <div className="language-input-hint">
              <span>{getCurrentLanguage().nativeName}</span>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
              className="chatbox-input"
              disabled={loading}
              placeholder="Ask about legal information..."
            />
            <button 
              className="chatbox-language-btn"
              onClick={toggleLanguageDropdown}
              title="Change language"
            >
              <GlobeIcon />
            </button>
            <button 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim()} 
              className="chatbox-send-btn"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <div className="chatbox-input-hint">
            Try asking: "What are my rights?" or "How do I file a complaint?"
          </div>
        </div>
      </div>

      <ResourceModal 
        resourceType={activeResource} 
        onClose={closeResourceModal} 
      />
    </div>
  );
};

export default ChatBox;