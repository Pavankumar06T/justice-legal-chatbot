import React, { useState } from "react";

const Sidebar = ({ sessions, currentSession, onSelectSession, onDeleteSession, onNewChat, isOpen, onClose, onResourceClick ,onLogout}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSessions = sessions.filter(session => 
    session.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Legal Conversations</h2>
          <button className="sidebar-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <button className="new-chat-btn" onClick={onNewChat}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Legal Chat
        </button>
        
        <div className="sidebar-search">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sidebar-search-input"
          />
        </div>
        
        <div className="sidebar-list">
          {filteredSessions.length === 0 ? (
            <div className="sidebar-empty">
              <div className="empty-icon">📝</div>
              <p>No conversations yet</p>
              <small>Start a new chat to get legal advice</small>
            </div>
          ) : (
            filteredSessions.map((s) => (
              <div
                key={s.session_id}
                className={`sidebar-item ${s.session_id === currentSession ? "selected" : ""}`}
                onClick={() => onSelectSession(s.session_id)}
              >
                <div className="sidebar-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="sidebar-item-content">
                  <div className="sidebar-item-title">{s.label}</div>
                  <div className="sidebar-item-time">{formatDate(s.created)}</div>
                </div>
                <button 
                  className="sidebar-item-delete"
                  onClick={(e) => onDeleteSession(s.session_id, e)}
                  title="Delete conversation"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="legal-resources">
          <h4>Quick Resources</h4>
          <div className="resource-link" onClick={() => onResourceClick('legal-forms')}>
            <span>📄</span>
            <span>Legal Forms</span>
          </div>
          <div className="resource-link" onClick={() => onResourceClick('rights-info')}>
            <span>⚖️</span>
            <span>Rights Info</span>
          </div>
          <div className="resource-link" onClick={() => onResourceClick('legal-library')}>
            <span>📚</span>
            <span>Legal Library</span>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <div className="resource-link" onClick={() => onResourceClick('help-faq')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Help & FAQ</span>
          </div>
        </div>
        <div class="sidebar-footer">
          <button class="logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
    </>
  );
};

export default Sidebar;