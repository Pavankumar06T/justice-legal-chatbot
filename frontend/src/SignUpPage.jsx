import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthPage.css';

const SignUpPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const getApiUrl = () => process.env.REACT_APP_API_URL || "http://localhost:8000";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            await axios.post(`${getApiUrl()}/register`, { username, password });
            alert('Registration successful! Please log in.');
            navigate('/login'); // Redirect to login page after successful registration
        } catch (err) {
            setError('Username already exists or server error.');
            console.error('Signup failed:', err);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Create Account</h2>
                <p>Get started with your Justice Assistant</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="auth-button">Sign Up</button>
                </form>
                <p className="auth-switch">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;