// src/Login.js
import React, { useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CsrfContext } from './CrsfContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const csrfToken = useContext(CsrfContext);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token' :  csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful! Token:', data.token);
        // 1) Store token (localStorage, cookies, or context)
        localStorage.setItem('token', data.token);
        // 2) Redirect to a protected page, e.g., /dashboard
        navigate('/inventorydata');
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMsg('An error occurred. Please try again.');
    }
  };
  
  return (
    <div className="login-page">
      <h2>Login</h2>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label><br />
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required
          />
        </div>
        <div>
          <label>Password:</label><br />
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required
          />
        </div>
        <button type="submit">Log In</button>
      </form>
    </div>
  );
}

export default Login;
