import React, { createContext, useState, useEffect, useCallback } from 'react';

// Provide both the current CSRF token and a method to refresh it on demand
export const CsrfContext = createContext({
  csrfToken: '',
  refreshCsrf: async () => ''
});

export const CsrfProvider = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch & update the latest CSRF token
  const refreshCsrf = useCallback(async () => {
    const res = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include' // include cookies for CSRF validation
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch CSRF token: ${res.status}`);
    }
    const data = await res.json();
    if (!data.csrfToken) {
      throw new Error('No csrfToken field in response');
    }
    setCsrfToken(data.csrfToken);
    return data.csrfToken;
  }, []);

  // On mount, load the initial token
  useEffect(() => {
    refreshCsrf().catch(err => {
      console.error('Error fetching CSRF token on mount:', err);
    });
  }, [refreshCsrf]);

  return (
    <CsrfContext.Provider value={{ csrfToken, refreshCsrf }}>
      {children}
    </CsrfContext.Provider>
  );
};