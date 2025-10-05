import React from 'react';
import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();

    if (!token) {
        // If no token, redirect to the login page
        return <Navigate to="/login" />;
    }

    return children; // If token exists, render the component
};

export default ProtectedRoute;