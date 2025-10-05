import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // Use plain axios for login
import './AuthPage.css'; // We'll create this CSS file next

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const getApiUrl = () => process.env.REACT_APP_API_URL || "http://localhost:8000";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // FastAPI's OAuth2PasswordRequestForm expects form data, not JSON
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        try {
            const response = await axios.post(`${getApiUrl()}/token`, params);
            login(response.data.access_token);
            navigate('/chat'); // Redirect to chat on successful login
        } catch (err) {
            setError('Invalid username or password.');
            console.error('Login failed:', err);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Login</h2>
                <p>Welcome back to the Justice Assistant</p>
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
                    <button type="submit" className="auth-button">Login</button>
                </form>
                <p className="auth-switch">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;