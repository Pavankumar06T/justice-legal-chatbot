import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthPage.css';

const SignUpPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const getApiUrl = () => process.env.REACT_APP_API_URL || "http://localhost:8000";

    const getPasswordStrength = (pwd) => {
        if (pwd.length === 0) return '';
        if (pwd.length < 6) return 'weak';
        if (pwd.length < 8) return 'medium';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) return 'medium';
        return 'strong';
    };

    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${getApiUrl()}/register`, 
                { username, password },
                { timeout: 10000 }
            );
            
            alert('Registration successful! Please log in.');
            navigate('/login');
        } catch (err) {
            if (err.response?.status === 400) {
                setError('Username already exists. Please choose another.');
            } else if (err.code === 'NETWORK_ERROR') {
                setError('Network error. Please check your connection.');
            } else {
                setError('Registration failed. Please try again.');
            }
            console.error('Signup failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Create Account</h2>
                <p>Join the Justice Assistant community</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="signup-username">Username</label>
                        <input
                            id="signup-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            required
                            disabled={loading}
                            minLength={3}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="signup-password">Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            required
                            disabled={loading}
                            minLength={6}
                        />
                        {password && (
                            <div className={`password-strength ${passwordStrength}`}>
                                <div className="password-strength-fill"></div>
                            </div>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="confirm-password">Confirm Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    {error && (
                        <div className="error-message" role="alert">
                            {error}
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        className={`auth-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-switch">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;