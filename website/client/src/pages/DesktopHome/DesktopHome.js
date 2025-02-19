import React from 'react';
import './style.css';

function DesktopHomePage() {
  return (
    <div className="desktophome">
      <div className="frame-20">
        <div className="navbar-2">
          <img className="frame-21" alt="Frame" src="/img/frame-55-1.png" />

          <div className="frame-22">
            <div className="text-wrapper-14">Admin ↗</div>
          </div>
        </div>

        <div className="hero-4">
          <div className="frame-23">
            <div className="welcome-to-the-wrapper">
              <p className="welcome-to-the">
                Welcome To The Aptitude Smart Shelving System
              </p>
            </div>

            <div className="frame-24">
              <p className="p">
                Your secure platform for tracking items, viewing recent
                activity, accessing reports, and more.
              </p>
            </div>

            <div className="btn-login-wrapper">
              <button className="btn-login" onClick={() => window.location.href = '/login'}>
                <span className="btn-text">LOG IN</span>
              </button>
            </div>
          </div>
        </div>

        <footer className="footer-4">
          <div className="frame-25">
            <div className="text-wrapper-15">aptitude</div>
          </div>

          <div className="frame-26">
            <div className="frame-27">
              <div className="text-wrapper-16">Aptitude</div>
            </div>

            <div className="frame-28">
              <div className="home-log-in-sign-up-4">
                <a href='/'>Home</a>
                <br />
                <a href='/login'>Log In</a>
                <br />
                <a href='/register'>Sign Up</a>
              </div>
            </div>
          </div>

          <div className="frame-29">
            <div className="frame-27">
              <div className="text-wrapper-17">Contact</div>
            </div>

            <div className="frame-28">
              <div className="email-website-4">
                Email
                <br />
                Website
                <br />
                Instagram
              </div>
            </div>
          </div>

          <div className="frame-29">
            <div className="frame-28">
              <div className="text-wrapper-18">Help</div>
            </div>

            <div className="frame-27">
              <div className="support-FAQ-4">
                Support
                <br />
                FAQ
              </div>
            </div>
          </div>
        </footer>

        <div className="ellipse-7" />

        <img className="ellipse-8" alt="Ellipse" src="/img/ellipse-2.png" />
      </div>

      <img
        className="rectangle-4"
        alt="Rectangle"
        src="/img/rectangle-21.png"
      />
    </div>
  );
}

export default DesktopHomePage;
