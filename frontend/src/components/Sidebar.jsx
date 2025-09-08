import React from "react";

const Sidebar = ({ sessions, currentSession, onSelectSession, onNewChat }) => (
  <div className="chatbox-sidebar">
    <div className="sidebar-header">
      <span>Conversations</span>
      <button className="new-chat-btn" onClick={onNewChat}>+ New Chat</button>
    </div>
    <div className="sidebar-list">
      {sessions.map((s) => (
        <div
          key={s.session_id}
          className={`sidebar-item${s.session_id === currentSession ? " selected" : ""}`}
          onClick={() => onSelectSession(s.session_id)}
        >
          <span className="sidebar-icon">🗨️</span>
          <span className="sidebar-text">{s.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default Sidebar;