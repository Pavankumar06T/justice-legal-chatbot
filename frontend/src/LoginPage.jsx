import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AuthPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const from = location.state?.from?.pathname || "/chat";
    const getApiUrl = () => process.env.REACT_APP_API_URL || "http://localhost:8000";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic validation
        if (!username.trim() || !password.trim()) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        try {
            const response = await axios.post(`${getApiUrl()}/token`, params, {
                timeout: 10000
            });
            
            login(response.data.access_token);
            navigate(from, { replace: true });
        } catch (err) {
            if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
                setError('Network error. Please check your connection.');
            } else if (err.response?.status === 401) {
                setError('Invalid username or password.');
            } else if (err.response?.status >= 500) {
                setError('Server error. Please try again later.');
            } else {
                setError('Login failed. Please try again.');
            }
            console.error('Login failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = () => {
        setUsername('demo');
        setPassword('demo123');
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Welcome Back</h2>
                <p>Sign in to your Justice Assistant account</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            disabled={loading}
                            aria-describedby={error ? "login-error" : undefined}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    {error && (
                        <div className="error-message" id="login-error" role="alert">
                            {error}
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        className={`auth-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-switch">
                    Don't have an account? <Link to="/signup">Create Account</Link>
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button 
                        onClick={handleDemoLogin}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--primary-color)',
                            color: 'var(--primary-color)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--border-radius)',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Fill Demo Credentials
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;