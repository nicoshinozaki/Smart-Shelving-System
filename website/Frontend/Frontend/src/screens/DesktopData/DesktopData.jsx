import React, { useState, useEffect } from "react";
import { ArrowRight } from "../../components/ArrowRight";
import "./style.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { SignOutBox } from "../../components/SignOutBox";
export const DesktopData = () => {
  const mockInventoryData = [
    { productName: "Capacitor", partNumber: "RX2331", inventoryAmount: 1 },
    { productName: "Test Tubes", partNumber: "SR1443", inventoryAmount: 12 },
    { productName: "Board", partNumber: "DII112K", inventoryAmount: 165 },
    { productName: "1K LED", partNumber: "LEDR1K", inventoryAmount: 13 },
    { productName: "PX Console", partNumber: "PX8899", inventoryAmount: 54 },
    { productName: "Resistor 20 Ohms", partNumber: "1KXD3E", inventoryAmount: 245 }
  ];  
  const [isOpen, setIsOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [userName, setUserName] = useState({ firstName: "User", lastName: "Name" });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [inventoryData, setInventoryData] = useState(mockInventoryData);
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
  const inventoryWithTags = mockInventoryData.map(item => ({
    ...item,
    tags: item.productName.includes("Resistor") ? "Electronics" :
          item.productName.includes("Test Tubes") ? "Chemicals" :
          "Hardware" 
  }));
  
  const filteredData = inventoryWithTags.filter(item =>
    (selectedTag === "All" || item.tags === selectedTag) &&
    (item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const sortedData = [...inventoryWithTags]
  .filter(item =>
    (selectedTag === "All" || item.tags === selectedTag) &&
    (item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  .sort((a, b) => {
    if (sortOption === "default") return 0;
    if (sortOption === "lowToHigh") return a.inventoryAmount - b.inventoryAmount;
    if (sortOption === "highToLow") return b.inventoryAmount - a.inventoryAmount;
    return 0;
  });

  return (
    <div className="desktop-data">
      <div className="frame">
        <div className="navbar">
          <img className="img" alt="Frame" src="/img/frame-55.png" />
          <div className="header-controls">
          <select 
            className="sort-dropdown"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="default">Sort By</option>
            <option value="lowToHigh">Item Count: Low to High</option>
            <option value="highToLow">Item Count: High to Low</option>
          </select>
          <select 
            className="filter-dropdown"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="All">Filter</option>
            <option value="Electronics">Electronics</option>
            <option value="Chemicals">Chemicals</option>
            <option value="Hardware">Hardware</option>
          </select>
          <input
            type="text"
            className="search-bar"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FontAwesomeIcon icon={faUser} className="user-icon" size="lg" onClick={toggleDialog}/>
          </div>
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
              {sortedData.map((item, index) => (
                <tr key={index}>
                  <td className="item-cell"><div className="div">{item.productName}</div></td>
                  <td className="item-cell"><div className="div">{item.partNumber}</div></td>
                  <td className="item-cell"><div className="div">{item.inventoryAmount}</div></td>
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
