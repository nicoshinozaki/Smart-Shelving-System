import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../api';
import './style.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const RegisterForm = () => {
  const { apiFetch } = useApi();
  const navigate = useNavigate();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    try {
      const res = await apiFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="desktop-login">
      <div className="frame-50">
        <div className="navbar-5">
          <img className="frame-51" alt="Frame" src="/img/frame-55.png" />
        </div>

        <div className="hero-7">
          <div className="frame-52">
            <div className="text-wrapper-34">Sign Up</div>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <form onSubmit={handleRegister} className="register-form">
              <div className="form-columns">
                {/* Column 1: Email & Passwords */}
                <div className="column">
                  <div className="frame-52">
                    <div className="text-wrapper-35">Email</div>
                    <div className="frame-53">
                      <div className="input-wrapper">
                        <input
                          className="element"
                          type="email"
                          placeholder="user@aptitudemedical.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="frame-52">
                    <div className="text-wrapper-35">Password</div>
                    <div className="frame-53">
                      <div className="input-wrapper">
                        <input
                          className="password"
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="frame-52">
                    <div className="text-wrapper-35">Confirm Password</div>
                    <div className="frame-53">
                      <div className="input-wrapper">
                        <input
                          className="password"
                          type="password"
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Names */}
                <div className="column">
                  <div className="frame-52">
                    <div className="text-wrapper-35">First Name</div>
                    <div className="frame-53">
                      <div className="input-wrapper">
                        <input
                          className="element"
                          type="text"
                          placeholder="First Name"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="frame-52">
                    <div className="text-wrapper-35">Last Name</div>
                    <div className="frame-53">
                      <div className="input-wrapper">
                        <input
                          className="element"
                          type="text"
                          placeholder="Last Name"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sign-in-button-wrapper">
                <button type="submit" className="sign-in-button-instance">
                  <div className="overlap-group-3">
                    <span className="text-wrapper-36">Register</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>

        <footer className="footer-7">
          <div className="frame-54"><div className="text-wrapper-37">aptitude</div></div>
          <div className="frame-55">
            <div className="frame-56"><div className="text-wrapper-38">Aptitude</div></div>
            <div className="frame-57"><div className="home-log-in-sign-up-7">
              <a href='/'>Home</a><br />
              <a href='/login'>Log In</a><br />
              <a href='/register'>Sign Up</a>
            </div></div>
          </div>
          <div className="frame-58">
            <div className="frame-56"><div className="text-wrapper-39">Contact</div></div>
            <div className="frame-57"><div className="email-website-7">Email<br />Website<br />Instagram</div></div>
          </div>
          <div className="frame-58">
            <div className="frame-57"><div className="text-wrapper-40">Help</div></div>
            <div className="frame-56"><div className="support-FAQ-7">Support<br />FAQ</div></div>
          </div>
        </footer>

        <div className="ellipse-13" />
        <img className="ellipse-14" alt="Ellipse" src="/img/ellipse-2.png" />
      </div>
      <img className="rectangle-7" alt="Rectangle" src="/img/rectangle-21.png" />
    </div>
  );
};

export default RegisterForm;