import React, { createContext, useState, useEffect } from 'react';

export const CsrfContext = createContext();

export const CsrfProvider = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    // Adjust the URL if needed (use the correct protocol and host)
    fetch('https://localhost/api/csrf-token', {
      credentials: 'include', // include cookies if your CSRF setup uses them
    })
      .then((res) => res.json())
      .then((data) => {
        setCsrfToken(data.csrfToken);
      })
      .catch((err) => console.error('Error fetching CSRF token:', err));
  }, []);

  return (
    <CsrfContext.Provider value={csrfToken}>
      {children}
    </CsrfContext.Provider>
  );
};
