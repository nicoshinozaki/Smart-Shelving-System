// src/App.js
import React from 'react';
// ...other imports

function HomePage() {
    return (
        <>
            {/* Header / Nav */}
            <header className="header">
              <div className="logo">
                <img
                  src="https://via.placeholder.com/100x40?text=aptitude"
                  alt="Aptitude Logo"
                />
              </div>
              <nav>
                <a href="#" className="get-started">Get Started ↗</a>
              </nav>
            </header>
      
            {/* Main Hero Section */}
            <main className="hero-section">
              <div className="hero-content">
                <h1>Welcome To<br />The Aptitude<br />Smart Shelving System</h1>
                <p>
                  Your secure platform for tracking items, viewing recent
                  activity, accessing reports, and more.
                </p>
                <div className="cta-buttons">
                  <a href="/login" className="btn primary-btn">Log In</a>
                  <a href="#" className="btn secondary-btn">Sign Up</a>
                </div>
              </div>
      
              <div className="hero-illustration">
                <img
                  src="https://via.placeholder.com/400x300?text=3D+Illustration"
                  alt="Dashboard Illustration"
                />
              </div>
            </main>
      
            {/* Footer */}
            <footer className="footer">
              <div className="footer-col">
                <h3>aptitude</h3>
              </div>
              <div className="footer-col">
                <h3>Aptitude</h3>
                <ul>
                  <li><a href="#">Home</a></li>
                  <li><a href="/login">Log In</a></li>
                  <li><a href="#">Sign Up</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h3>Contact</h3>
                <ul>
                  <li><a href="#">Email</a></li>
                  <li><a href="#">Website</a></li>
                  <li><a href="#">Instagram</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h3>Help</h3>
                <ul>
                  <li><a href="#">Support</a></li>
                  <li><a href="#">FAQ</a></li>
                </ul>
              </div>
            </footer>
          </>
          );
}

export default HomePage;
