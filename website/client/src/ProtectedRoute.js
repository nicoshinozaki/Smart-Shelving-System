import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Simple authentication check: assume user is "logged in" if a token exists
  const isLoggedIn = !!localStorage.getItem('token'); // or any flag that indicates login

  if (!isLoggedIn) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
