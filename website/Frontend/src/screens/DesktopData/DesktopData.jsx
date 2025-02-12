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

  console.log("Debug: Entering Desktop Data")

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const csrfResponse = await fetch("https://localhost:5000/api/csrf-token", {
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

  const [tableData, setTableData] = useState([]);
  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        console.log("Fetching SpreadSheet Data: API Call")
        const response = await fetch("https://localhost:5000/api/sheet-data");
        const jsonData = await response.json();
        setTableData(jsonData.data || []);
      } catch (err) {
        console.error("Error fetching sheet data:", err);
      }
    };
    fetchSheetData();
  }, []);

  return (
    <div className="desktop-data">
      <div className="frame">
        <div className="navbar">
          <img className="img" alt="Frame" src="/img/frame-55.png" />
          <FontAwesomeIcon icon={faUser} className="user-icon" size="lg" onClick={toggleDialog} />
        </div>
        <div className="hero">
          <div className={`sign-out-container ${isOpen ? "show" : ""}`}>
            <SignOutBox
              firstName={userName.firstName}
              lastName={userName.lastName}
              csrfToken={csrfToken}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Part Number</th>
                <th>Amount in Inventory</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                </tr>
              ))}
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
