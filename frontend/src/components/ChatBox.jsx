import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./ChatBox.css";

const getApiUrl = () => process.env.REACT_APP_API_URL || "http://localhost:8000";

const initBotMsg = () => ({
  id: Date.now().toString(),
  sender: "bot",
  text: "Hello! How can I help you with Justice Department information?"
});

const createSession = () => ({
  session_id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
  label: "New Chat " + new Date().toLocaleTimeString()
});

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initBotMsg()]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([createSession()]);
  const [currentSessionId, setCurrentSessionId] = useState(sessions[0].session_id);

  useEffect(() => {
    setMessages([initBotMsg()]);
  }, [currentSessionId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = { id: Date.now().toString(), sender: "user", text: input };
    setMessages((msgs) => [...msgs, msg]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${getApiUrl()}/chat`,
        { user_message: input, session_id: currentSessionId }
      );
      const botMsg = { id: Date.now().toString(), sender: "bot", text: response.data.bot_response };
      setMessages((msgs) => [...msgs, botMsg]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { id: Date.now().toString(), sender: "bot", text: "Sorry, connection error." }
      ]);
    }
    setLoading(false);
  };

  const handleSelectSession = (sid) => {
    setCurrentSessionId(sid);
    // (Optional) Load chat history for existing session from backend if implemented
    setMessages([initBotMsg()]);
  };

  const handleNewChat = () => {
    const newSession = createSession();
    setSessions((s) => [...s, newSession]);
    setCurrentSessionId(newSession.session_id);
    setMessages([initBotMsg()]);
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
        <div className="chatbox-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chatbox-message-row ${msg.sender}`}>
              <div className={`chatbox-message-bubble ${msg.sender}`}>
                <b className="chatbox-message-sender">
                  {msg.sender === "user" ? "You" : "Bot"}
                </b>
                <span className="chatbox-message-text">{msg.text}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chatbox-loading">
              <i>Loading...</i>
            </div>
          )}
        </div>
        <div className="chatbox-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            className="chatbox-input"
            disabled={loading}
            placeholder="Type your message..."
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="chatbox-send-btn">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;