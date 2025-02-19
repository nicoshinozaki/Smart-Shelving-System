import React, { use, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]           = useState('');
  const [message, setMessage]       = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Basic client-side check for matching passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Registration successful!');
        setError('');
      } else {
        setError(data.error || 'Registration failed');
        setMessage('');
      }
    } catch (err) {
      setError('An error occurred during registration.');
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Register</h2>
      <input 
        type="email" 
        placeholder="Email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      /><br />
      <input 
        type="password" 
        placeholder="Password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      /><br />
      <input 
        type="password" 
        placeholder="Confirm Password" 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      /><br />
      <button type="submit">Register</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {message && <p style={{color: 'green'}}>{message}</p>}
    </form>
  );
};

export default RegisterForm;
