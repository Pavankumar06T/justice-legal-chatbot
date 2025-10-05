import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';
import LoginPage from './LoginPage.jsx';
import SignUpPage from './SignUpPage.jsx';
import ChatBox from './components/ChatBox.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatBox />
              </ProtectedRoute>
            } 
          />
          {/* Redirect root path to /chat */}
          <Route path="/" element={<Navigate to="/chat" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;