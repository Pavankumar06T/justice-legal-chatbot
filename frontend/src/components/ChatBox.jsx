import React, { useState } from "react";
import axios from "axios";
import "./ChatBox.css";

const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2, 11);

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: generateId(), sender: "user", text: input };
    setMessages([...messages, userMsg]);
    setInput(""); // Clear input immediately after sending
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await axios.post(`${apiUrl}/chat`, { message: input });
      const botMsg = { id: generateId(), sender: "bot", text: response.data.reply };
      setMessages((msgs) => [...msgs, botMsg]);
    } catch (error) {
      const errorMsg = { id: generateId(), sender: "bot", text: "Error: Could not reach server." };
      setMessages((msgs) => [...msgs, errorMsg]);
    }
    setLoading(false);
  };

  return (
    <div className="chatbox-container">
      {/* Chat messages area */}
      <div className="chatbox-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chatbox-message-row ${msg.sender === "user" ? "user" : "bot"}`}
          >
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

      {/* Input area */}
      <div className="chatbox-input-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" ? handleSend() : null}
          className="chatbox-input"
          disabled={loading}
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="chatbox-send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;