import React, { useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CsrfContext } from '../../CrsfContext';
import './style.css';


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful! Token:', data.token);
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
    <div className="desktop-login">
      <div className="frame-50">
        <div className="navbar-5">
          <img className="frame-51" alt="Frame" src="/img/frame-55.png" />
        </div>

        <div className="hero-7">
          <div className="frame-52">
            <div className="text-wrapper-34">Sign In</div>
            {errorMsg && <p className="error-message">{errorMsg}</p>}
            <form onSubmit={handleSubmit}>
              <div className="frame-52">
                <div className="text-wrapper-35">Employee Email</div>
                <div className="frame-53">
                  <div className="input-wrapper">
                    <input 
                      className="element" 
                      placeholder="user@aptitudmedical.com"
                      type="email"
                      name="employeeId"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      pattern="[\-a-zA-Z0-9~!$%^&amp;*_=+\}\{'?]+(\.[\-a-zA-Z0-9~!$%^&amp;*_=+\}\{'?]+)*@[a-zA-Z0-9_][\-a-zA-Z0-9_]*(\.[\-a-zA-Z0-9_]+)*\.[cC][oO][mM](:[0-9]{1,5})?"
                      title="Please enter a valid email address"
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="frame-52">
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div className="frame-53">
                  <div className="input-wrapper">
                    <input
                      className="password"
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="checkbox-frame">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="rememberMe">Remember Me</label>
              </div>

              <div className="sign-in-button-wrapper">
                <button type="submit" className="sign-in-button">
                  <div className="overlap-group-3">
                    <span className="text-wrapper-36">Sign In</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>

        <footer className="footer-7">
          <div className="frame-54">
            <div className="text-wrapper-37">aptitude</div>
          </div>

          <div className="frame-55">
            <div className="frame-56">
              <div className="text-wrapper-38">Aptitude</div>
            </div>

            <div className="frame-57">
              <div className="home-log-in-sign-up-7">
                Home
                <br />
                Log In
                <br />
                Sign Up
              </div>
            </div>
          </div>

          <div className="frame-58">
            <div className="frame-56">
              <div className="text-wrapper-39">Contact</div>
            </div>

            <div className="frame-57">
              <div className="email-website-7">
                Email
                <br />
                Website
                <br />
                Instagram
              </div>
            </div>
          </div>

          <div className="frame-58">
            <div className="frame-57">
              <div className="text-wrapper-40">Help</div>
            </div>

            <div className="frame-56">
              <div className="support-FAQ-7">
                Support
                <br />
                FAQ
              </div>
            </div>
          </div>
        </footer>

        <div className="ellipse-13" />

        <img className="ellipse-14" alt="Ellipse" src="/img/ellipse-2.png" />
      </div>

      <img
        className="rectangle-7"
        alt="Rectangle"
        src="/img/rectangle-21.png"
      />
    </div>
  );
}

export default Login;
