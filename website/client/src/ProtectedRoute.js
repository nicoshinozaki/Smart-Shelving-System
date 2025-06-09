// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { loading, isAuth, role } = useAuth();

  // 1) Still loading? show a placeholder
  if (loading) {
    return <div>Loading…</div>;
  }

  // 2) Not authenticated? kick them to login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // 3) Wrong role? send them home (or somewhere safe)
  if (requiredRole && role.toLowerCase() !== requiredRole.toLowerCase()) {
    switch (role.toLowerCase()) {
      case "admin":
        return <Navigate to="/adminpage" replace />;
        break;
      case "employee":
        return <Navigate to="/inventoryData" replace />;
    }
  }

  // 4) All good – render the protected content
  return children;
}
