import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Initialize token from localStorage to stay logged in across page reloads
    const [token, setToken] = useState(localStorage.getItem('authToken'));

    const login = (newToken) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily access the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};