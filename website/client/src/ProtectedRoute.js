// ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredRole }) {
  const [auth, setAuth] = useState({ loading: true, isAuth: false, role: null });

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(async res => {
        if (res.ok) {
          const body = await res.json();
          setAuth({ loading: false, isAuth: true, role: body.role });
        } else {
          setAuth({ loading: false, isAuth: false, role: null });
        }
      })
      .catch(() => setAuth({ loading: false, isAuth: false, role: null }));
  }, []);

  if (auth.loading) {
    return <div>Loading…</div>;
  }
  if (!auth.isAuth) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && auth.role.toLowerCase() !== requiredRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }
  return children;
}
