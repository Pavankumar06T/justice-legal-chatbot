import React, { useState, useEffect, useRef, useCallback } from "react";
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
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

// Constants
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

const SUGGESTIONS = [
  "What are my rights?",
  "How do I file a complaint?",
  "What legal documents do I need?",
  "How to find a lawyer?",
  "Explain consumer protection laws",
  "What is the process for property registration?",
  "How to write a legal notice?",
  "What are my employment rights?"
];

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
  const [suggestions] = useState(SUGGESTIONS);
  const [error, setError] = useState({ type: '', message: '' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (error.type === 'network') {
        setError({ type: '', message: '' });
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError({ type: 'network', message: 'You are offline. Some features may not work.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error.type]);

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
        
        if (sessionsData.length > 0) {
          setCurrentSessionId(null); 
        } else {
          handleNewChat();
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        if (error.response?.status === 401) {
          setError({ type: 'auth', message: 'Session expired. Please refresh the page.' });
        } else if (!isOnline) {
          setError({ type: 'network', message: 'Cannot load sessions while offline.' });
        } else {
          setError({ type: 'server', message: 'Failed to load conversations.' });
        }
        setCurrentSessionId(null);
      }
    };
    
    fetchSessions();
  }, [isOnline]);

  // Load messages for current session
  useEffect(() => {
    const fetchSessionHistory = async () => {
      if (!currentSessionId) {
        setMessages([initBotMsg()]);
        return;
      }
      
      try {
        setLoading(true);
        const response = await api.get(`${getApiUrl()}/sessions/${currentSessionId}/history`);
        const sessionData = response.data;
        
        if (sessionData.history && sessionData.history.length > 0) {
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
        if (error.response?.status === 401) {
          setError({ type: 'auth', message: 'Session expired. Please refresh the page.' });
        } else {
          setError({ type: 'server', message: 'Failed to load chat history.' });
        }
        setMessages([initBotMsg()]);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentSessionId !== undefined) {
      fetchSessionHistory();
    }
  }, [currentSessionId]);

  const handleSend = useCallback(async (message = null) => {
    const messageText = message || input.trim();
    if (!messageText) return;
    
    if (!isOnline) {
      setError({ type: 'network', message: 'Cannot send messages while offline' });
      return;
    }

    const userMsg = { 
      id: Date.now().toString(), 
      sender: "user", 
      text: messageText,
      timestamp: new Date(),
      language: selectedLanguage
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError({ type: '', message: '' });
    
    let sessionIdToSend = currentSessionId;
    
    if (!currentSessionId) {
      sessionIdToSend = null; 
    }

    try {
      const response = await api.post(
        `${getApiUrl()}/chat`,
        { 
          user_message: messageText, 
          session_id: sessionIdToSend,
          language: selectedLanguage
        },
        { timeout: 30000 }
      );
      
      const botMsg = { 
        id: Date.now().toString() + '-bot',
        sender: "bot", 
        text: response.data.bot_response,
        timestamp: new Date(),
        language: selectedLanguage
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      const sessionsResponse = await api.get(`${getApiUrl()}/sessions`);
      setSessions(sessionsResponse.data);
      
      if (!currentSessionId) {
        setCurrentSessionId(response.data.session_id);
      }
    } catch (err) {
      console.error("Chat error:", err);
      
      let errorMessage = "Sorry, I'm experiencing connection issues. Please try again in a moment.";
      
      if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = "Network error. Please check your connection and try again.";
        setError({ type: 'network', message: errorMessage });
      } else if (err.response?.status >= 500) {
        errorMessage = "Server is temporarily unavailable. Please try again later.";
      } else if (err.response?.status === 401) {
        errorMessage = "Session expired. Please refresh the page.";
        setError({ type: 'auth', message: errorMessage });
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please try again.";
      }
      
      const errorMsg = { 
        id: Date.now().toString() + '-error', 
        sender: "bot", 
        text: errorMessage,
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMsg]);
    }
    setLoading(false);
  }, [input, isOnline, currentSessionId, selectedLanguage]);

  const handleSelectSession = useCallback(async (sid) => {
    setCurrentSessionId(sid);
    setIsSidebarOpen(false);
    setError({ type: '', message: '' });
  }, []);

  const handleNewChat = useCallback(async () => {
    try {
      const response = await api.post(
        `${getApiUrl()}/chat`,
        { 
          user_message: initBotMsg().text,
          session_id: null,
          language: selectedLanguage 
        }
      );
      
      const sessionsResponse = await api.get(`${getApiUrl()}/sessions`);
      setSessions(sessionsResponse.data);
      
      setCurrentSessionId(response.data.session_id);
      setMessages([initBotMsg()]);
    } catch (error) {
      console.error("Error creating new chat:", error);
      const newSession = createSession();
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.session_id);
      setMessages([initBotMsg()]);
      
      if (error.response?.status === 401) {
        setError({ type: 'auth', message: 'Session expired. Please refresh the page.' });
      } else {
        setError({ type: 'server', message: 'Failed to create new chat. Starting local session.' });
      }
    }
    setIsSidebarOpen(false);
  }, [selectedLanguage]);

  const handleDeleteSession = useCallback(async (sessionId, e) => {
    e.stopPropagation();
    
    if (sessions.length <= 1) {
      setError({ type: 'warning', message: 'You need to have at least one conversation.' });
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this conversation?")) {
      return;
    }
    
    try {
      await api.delete(`${getApiUrl()}/sessions/${sessionId}`);
      
      const sessionsResponse = await api.get(`${getApiUrl()}/sessions`);
      setSessions(sessionsResponse.data);
      
      if (sessionId === currentSessionId) {
        if (sessionsResponse.data.length > 0) {
          setCurrentSessionId(sessionsResponse.data[0].session_id);
        } else {
          setCurrentSessionId(null);
          setMessages([initBotMsg()]);
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      setError({ type: 'server', message: 'Failed to delete conversation. Please try again.' });
    }
  }, [sessions.length, currentSessionId]);

  const toggleTheme = useCallback(() => {
    setIsDarkTheme(!isDarkTheme);
  }, [isDarkTheme]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleResourceClick = useCallback((resource) => {
    setActiveResource(resource);
    if (window.innerWidth < 968) {
      setIsSidebarOpen(false);
    }
  }, []);

  const closeResourceModal = useCallback(() => {
    setActiveResource(null);
  }, []);

  const formatTime = useCallback((date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const handleSuggestionClick = useCallback((suggestion) => {
    handleSend(suggestion);
  }, [handleSend]);

  const handleLanguageSelect = useCallback((languageCode) => {
    setSelectedLanguage(languageCode);
    setShowLanguageDropdown(false);
  }, []);

  const toggleLanguageDropdown = useCallback(() => {
    setShowLanguageDropdown(!showLanguageDropdown);
  }, [showLanguageDropdown]);

  const getCurrentLanguage = useCallback(() => {
    return INDIAN_LANGUAGES.find(lang => lang.code === selectedLanguage) || INDIAN_LANGUAGES[0];
  }, [selectedLanguage]);

  const createMarkup = useCallback((htmlContent) => {
    let content = htmlContent
        .replace(/^(?:\* )|^(?:- )|^(?:\d+\. )/gm, (match) => {
            return `\n${match}`;
        })
        .replace(/\n/g, '<br/>');

    content = content
        .replace(/<br\/>\s*<br\/>/g, '<br/>')
        .replace(/^(<br\/>)+/g, '')
        .replace(/(<br\/>)+$/g, '');

    return { __html: content };
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const clearError = useCallback(() => {
    setError({ type: '', message: '' });
  }, []);

  const showWelcomeScreen = !currentSessionId || messages.length <= 1;

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
          <button 
            className="menu-toggle" 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
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
            <div className="language-selector-container" ref={languageDropdownRef}>
              <button 
                className="header-btn language-toggle" 
                onClick={toggleLanguageDropdown}
                title="Select language"
                aria-label={`Current language: ${getCurrentLanguage().name}. Click to change language.`}
              >
                <GlobeIcon />
                <span>{getCurrentLanguage().code.toUpperCase()}</span>
              </button>
              
              {showLanguageDropdown && (
                <div className="language-dropdown">
                  <div className="language-dropdown-header">
                    <span>Select Language</span>
                  </div>
                  <div className="language-list">
                    {INDIAN_LANGUAGES.map((language) => (
                      <div
                        key={language.code}
                        className={`language-option ${selectedLanguage === language.code ? 'selected' : ''}`}
                        onClick={() => handleLanguageSelect(language.code)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && handleLanguageSelect(language.code)}
                        aria-label={`Select ${language.name}`}
                      >
                        <span className="language-name">{language.name}</span>
                        <span className="language-native">{language.nativeName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              className="header-btn theme-toggle" 
              onClick={toggleTheme}
              aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDarkTheme ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error.message && (
          <div className={`error-banner ${error.type}`} role="alert">
            <span>{error.message}</span>
            <button 
              onClick={clearError}
              aria-label="Dismiss error message"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="chatbox-messages">
          {showWelcomeScreen && (
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
                    aria-label={`Ask: ${suggestion}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg) => (
            (currentSessionId || msg.sender === 'bot' || !showWelcomeScreen) && (
                <div key={msg.id} className={`chatbox-message-row ${msg.sender}`}>
                <div className="chatbox-message-avatar">
                    {msg.sender === "user" ? <UserIcon /> : <JusticeIcon />}
                </div>
                <div className={`chatbox-message-content ${msg.sender}`}>
                    <div className="chatbox-message-bubble">
                    <div 
                      className="chatbox-message-text" 
                      dangerouslySetInnerHTML={createMarkup(msg.text)} 
                    />
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
            )
          ))}
          
          {loading && (
            <div className="chatbox-message-row bot">
              <div className="chatbox-message-avatar">
                <JusticeIcon />
              </div>
              <div className="chatbox-message-content bot">
                <div className="chatbox-message-bubble loading-dots">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
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
              onKeyDown={(e) => { 
                if (e.key === "Enter" && !e.shiftKey) { 
                  e.preventDefault(); 
                  handleSend(); 
                } 
              }}
              className="chatbox-input"
              disabled={loading || !isOnline}
              placeholder="Ask about legal information..."
              aria-label="Type your message"
            />
            
            <button 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim() || !isOnline} 
              className="chatbox-send-btn"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <div className="chatbox-input-hint">
            {isOnline 
              ? "Try asking: 'What are my rights?' or 'How do I file a complaint?'"
              : "You are currently offline. Please check your internet connection."
            }
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

export default React.memo(ChatBox);