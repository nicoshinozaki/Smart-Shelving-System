// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext({
  loading: true,
  isAuth: false,
  role: null,
  loginSuccess: () => {},
});

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth]   = useState(false);
  const [role, setRole]       = useState(null);

  // on mount, check current user—include cookies so the session stays alive
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Not authenticated');
        const user = await res.json();
        setIsAuth(true);
        setRole(user.role);
      } catch {
        setIsAuth(false);
        setRole(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // call this after a successful login
  const loginSuccess = newRole => {
    setIsAuth(true);
    setRole(newRole);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ loading, isAuth, role, loginSuccess }}>
      {children}
    </AuthContext.Provider>
  );
}

// custom hook for easy access
export function useAuth() {
  return useContext(AuthContext);
}
