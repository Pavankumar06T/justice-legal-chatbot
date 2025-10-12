import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="nav-brand">
          <div className="justice-icon">⚖️</div>
          <span>Justice Assistant</span>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/signup" className="nav-btn">Get Started</Link>
        </div>
      </nav>

      {/* ADDED MAIN WRAPPER - THIS FIXES SCROLLING */}
      <main className="landing-main">
        <div className="landing-hero">
          <div className="hero-content">
            <h1>Your AI-Powered Legal Assistant</h1>
            <p className="hero-subtitle">
              Get instant access to legal information, forms, and resources in multiple languages. 
              Understand your rights and navigate legal processes with confidence.
            </p>
            
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon">🌐</div>
                <h3>Multi-Language Support</h3>
                <p>Available in 13 Indian languages for better accessibility</p>
              </div>
              
              <div className="feature">
                <div className="feature-icon">⚡</div>
                <h3>Instant Responses</h3>
                <p>Get quick answers to your legal questions 24/7</p>
              </div>
              
              <div className="feature">
                <div className="feature-icon">📚</div>
                <h3>Legal Resources</h3>
                <p>Access forms, rights information, and legal library</p>
              </div>
            </div>

            <div className="hero-actions">
              <Link to="/signup" className="primary-btn">Start Free Today</Link>
              <Link to="/login" className="secondary-btn">Existing User</Link>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">99%</div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="stat">
                <div className="stat-number">13</div>
                <div className="stat-label">Languages</div>
              </div>
              <div className="stat">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Availability</div>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="chat-preview">
              <div className="chat-message user">
                <div className="message-avatar">👤</div>
                <div className="message-bubble">How do I file a complaint?</div>
              </div>
              <div className="chat-message bot">
                <div className="message-avatar">⚖️</div>
                <div className="message-bubble">I can help you with that! You can file a complaint through the proper legal channels...</div>
              </div>
              <div className="chat-input-preview">
                <input type="text" placeholder="Type your legal question..." />
                <button>Send</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2024 Justice Assistant. Empowering citizens with legal knowledge.</p>
      </footer>
    </div>
  );
};

export default LandingPage;