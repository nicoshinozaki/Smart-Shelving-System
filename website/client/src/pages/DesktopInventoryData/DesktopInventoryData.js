import React, { useState, useEffect, useContext } from 'react';
import { ArrowRight } from "../../components/ArrowRight";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { SignOutBox } from "../../components/SignOutBox";
import { CsrfContext } from '../../CrsfContext';

function InventoryData() {
  const csrfToken = useContext(CsrfContext);
  const [sheetData, setSheetData] = useState([]);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState("All");
  const [userName, setUserName] = useState({ firstName: "User", lastName: "Name" });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toggle for the user dialog
  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  // Fetch user data from localStorage
  useEffect(() => {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUserName(JSON.parse(stored));
      }
    }, []);

  // Fetch Google Sheet data and convert it into an object format
  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        const response = await fetch("/api/sheets-data");
        const data = await response.json();

        // Make sure there is data and at least one data row (after headers)
        if (data.values && data.values.length > 1) {
          // Assume first row is header names
          const [headers, ...rows] = data.values;
          // Convert rows to an array of objects using headers as keys
          const mappedData = rows.map(row => {
            const item = {};
            headers.forEach((header, index) => {
              // Map only the fields you care about.
              if (header.toLowerCase().includes("drawer number")) {
                item.productName = row[index];
              } else if (header.toLowerCase().includes("item number")) {
                item.partNumber = row[index];
              } else if (header.toLowerCase().includes("inventory amount")) {
                // Ensure inventory amount is numeric
                item.inventoryAmount = Number(row[index]);
              }
            });
            return item;
          });
          // Add tags based on the product name for filtering purposes
          const inventoryWithTags = mappedData.map(item => ({
            ...item,
            tags:
              item.productName && item.productName.includes("Resistor")
                ? "Electronics"
                : item.productName && item.productName.includes("Test Tubes")
                ? "Chemicals"
                : "Hardware",
          }));
          setInventoryData(inventoryWithTags);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching sheet data:", err);
        setLoading(false);
      }
    };

    fetchSheetData();
  }, []);

  // Filtering based on selected tag and search query
  const filteredData = inventoryData.filter(item =>
    (selectedTag === "All" || item.tags === selectedTag) &&
    (item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sorting based on the chosen sort option
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOption === "default") return 0;
    if (sortOption === "lowToHigh") return a.inventoryAmount - b.inventoryAmount;
    if (sortOption === "highToLow") return b.inventoryAmount - a.inventoryAmount;
    return 0;
  });

  // Show a loader or message if data is not available
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!inventoryData.length) {
    return <div>No data found.</div>;
  }

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
            <FontAwesomeIcon
              icon={faUser}
              className="user-icon"
              size="lg"
              onClick={toggleDialog}
            />
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
                <th className="header-cell">
                  <div className="text-wrapper">Product Name</div>
                </th>
                <th className="header-cell">
                  <div className="text-wrapper">Part Number</div>
                </th>
                <th className="header-cell">
                  <div className="text-wrapper">Amount in Inventory</div>
                </th>
                <th className="header-cell">
                  <div className="text-wrapper">Activity</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index}>
                  <td className="item-cell">
                    <div className="div">{item.productName}</div>
                  </td>
                  <td className="item-cell">
                    <div className="div">{item.partNumber}</div>
                  </td>
                  <td className="item-cell">
                    <div className="div">{item.inventoryAmount}</div>
                  </td>
                  <td className="arrow-right-wrapper">
                    <div className="arrow-container">
                      <ArrowRight
                        className="arrow-right-instance"
                        img="/img/arrow-right.png"
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
}

export default InventoryData;
