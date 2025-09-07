import React, { useState } from "react";
import axios from "axios";
import "./ChatBox.css";

const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2, 11);

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: generateId(), sender: "bot", text: "Hello! How can I help you with Justice Department information?" }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { id: generateId(), sender: "user", text: input };
    setMessages([...messages, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";

      const response = await axios.post(
        `${apiUrl}/chat`,
        { user_message: input }
      );

      const botMsg = { id: generateId(), sender: "bot", text: response.data.bot_response };
      setMessages((msgs) => [...msgs, botMsg]);
    } catch (error) {
      const errorMsg = {
        id: generateId(),
        sender: "bot",
        text: "Sorry, there was an error connecting to the chatbot."
      };
      setMessages((msgs) => [...msgs, errorMsg]);
    }

    setLoading(false);
  };

  return (
    <div className="chatbox-container">
      {/* Chat messages */}
      <div className="chatbox-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chatbox-message-row ${msg.sender === "user" ? "user" : "bot"}`}
          >
            <div className={`chatbox-message-bubble ${msg.sender}`}>
              <b className="chatbox-message-sender">{msg.sender === "user" ? "You" : "Bot"}</b>
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

      {/* Input */}
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
  );
};

export default ChatBox;