import React, { useState, useEffect } from "react";
import { ArrowRight } from "../../components/ArrowRight";
import "./style.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { SignOutBox } from "../../components/SignOutBox";
export const DesktopData = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [userName, setUserName] = useState({ firstName: "User", lastName: "Name" });
  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const csrfResponse = await fetch("https://localhost:8080/api/csrf-token", {
          credentials: "include", // Include cookies
        });
        const csrfData = await csrfResponse.json();
        setCsrfToken(csrfData.csrfToken); // Store the token in state
        console.log("🟢 CSRF Token fetched and set:", csrfData.csrfToken);
      } catch (err) {
        console.error("🔴 Failed to fetch CSRF token:", err);
      }
    };
    fetchCsrfToken();
  }, []);
  
  useEffect(() => {
    // Fetch user data from localStorage
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUserName(storedUser);
    }
  }, []);
  return (
    <div className="desktop-data">
      <div className="frame">
        <div className="navbar">
          <img className="img" alt="Frame" src="/img/frame-55.png" />
          <FontAwesomeIcon icon={faUser} className="user-icon" size="lg" onClick={toggleDialog}/>
        </div>
        <div className="hero">
          <div className={`sign-out-container ${isOpen ? "show" : ""}`}>
            <SignOutBox
                  firstName={userName.firstName}
                  lastName={userName.lastName}
                  csrfToken={csrfToken}
              />
          </div>
          <table className="table">
            <thead>
                <tr>
                  <th className="header-cell"><div className="text-wrapper">Product Name</div></th>
                    <th className="header-cell"><div className="text-wrapper">Part Number</div></th>
                    <th className="header-cell"><div className="text-wrapper">Amount in Inventory</div></th>
                    <th className="header-cell"><div className="text-wrapper">Activity</div></th>
                </tr>
            </thead>
            <tbody>
              <tr>
                <td className="item-cell"><div className="div">Capacitor</div></td>
                <td className="item-cell"><div className="div">RX2332</div></td>
                <td className="item-cell"><div className="div">1</div></td>
                <td className="arrow-right-wrapper">
                    <div className="arrow-container">
                      <ArrowRight
                        className="arrow-right-instance"
                        img="https://cdn.animaapp.com/projects/678b2a0b0cccaf0892a06da3/releases/679428d01a5876cee0f3ff15/img/arrow-right@2x.png"
                        size="forty-eight"
                      />
                    </div>
                  </td>
              </tr>
              <tr>
                  <td className="item-cell"><div className="div">Test Tubes</div></td>
                  <td className="item-cell"><div className="div">SR1443</div></td>
                  <td className="item-cell"><div className="div">12</div></td>
                  <td className="arrow-right-wrapper">
                    <div className="arrow-container">
                      <ArrowRight
                        className="arrow-right-instance"
                        img="https://cdn.animaapp.com/projects/678b2a0b0cccaf0892a06da3/releases/679428d01a5876cee0f3ff15/img/arrow-right@2x.png"
                        size="forty-eight"
                      />
                    </div>
                  </td>
              </tr>
              <tr>
                  <td className="item-cell"><div className="div">Board</div></td>
                  <td className="item-cell"><div className="div">DII112K</div></td>
                  <td className="item-cell"><div className="div">165</div></td>
                  <td className="arrow-right-wrapper">
                    <div className="arrow-container">
                      <ArrowRight
                        className="arrow-right-instance"
                        img="https://cdn.animaapp.com/projects/678b2a0b0cccaf0892a06da3/releases/679428d01a5876cee0f3ff15/img/arrow-right@2x.png"
                        size="forty-eight"
                      />
                    </div>
                  </td>
              </tr>
              <tr>
                  <td className="item-cell"><div className="div">1K LED</div></td>
                  <td className="item-cell"><div className="div">LEDR1K</div></td>
                  <td className="item-cell"><div className="div">13</div></td>
                  <td className="arrow-right-wrapper">
                    <div className="arrow-container">
                      <ArrowRight
                        className="arrow-right-instance"
                        img="https://cdn.animaapp.com/projects/678b2a0b0cccaf0892a06da3/releases/679428d01a5876cee0f3ff15/img/arrow-right@2x.png"
                        size="forty-eight"
                      />
                    </div>
                  </td>
              </tr>
              <tr>
                  <td className="item-cell"><div className="div">PX Console</div></td>
                  <td className="item-cell"><div className="div">PX8899</div></td>
                  <td className="item-cell"><div className="div">54</div></td>
                  <td className="arrow-right-wrapper">
                    <div className="arrow-container">
                      <ArrowRight
                        className="arrow-right-instance"
                        img="https://cdn.animaapp.com/projects/678b2a0b0cccaf0892a06da3/releases/679428d01a5876cee0f3ff15/img/arrow-right@2x.png"
                        size="forty-eight"
                      />
                    </div>
                  </td>
              </tr>
              <tr>
                  <td className="item-cell"><div className="div">Resistor 20 Ohms</div></td>
                  <td className="item-cell"><div className="div">1KXD3E</div></td>
                  <td className="item-cell"><div className="div">245</div></td>
                  <td className="arrow-right-wrapper">
                    <div className="arrow-container">
                      <ArrowRight
                        className="arrow-right-instance"
                        img="https://cdn.animaapp.com/projects/678b2a0b0cccaf0892a06da3/releases/679428d01a5876cee0f3ff15/img/arrow-right@2x.png"
                        size="forty-eight"
                      />
                    </div>
                  </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer className="footer">
          <div className="div-wrapper">
            <div className="text-wrapper-2">aptitude</div>
          </div>

          <div className="frame-2">
            <div className="frame-3">
              <div className="text-wrapper-3">Aptitude</div>
            </div>

            <div className="frame-4">
              <div className="home-log-in-sign-up">
                Home
                <br />
                Log In
                <br />
                Sign Up
              </div>
            </div>
          </div>

          <div className="frame-5">
            <div className="frame-3">
              <div className="text-wrapper-4">Contact</div>
            </div>

            <div className="frame-4">
              <div className="email-website">
                Email
                <br />
                Website
                <br />
                Instagram
              </div>
            </div>
          </div>

          <div className="frame-5">
            <div className="frame-4">
              <div className="text-wrapper-5">Help</div>
            </div>

            <div className="frame-3">
              <div className="support-FAQ">
                Support
                <br />
                FAQ
              </div>
            </div>
          </div>
        </footer>

        <div className="ellipse" />

        <img className="ellipse-2" alt="Ellipse" src="/img/ellipse-2.png" />
      </div>

      <img className="rectangle" alt="Rectangle" src="/img/rectangle-21.png" />
    </div>
  );
};
