import React, { useState, useEffect, useContext } from "react";
import { ArrowRight } from "../../components/ArrowRight";
import "./style.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { SignOutBox } from "../../components/SignOutBox";
import { SignInButton } from "../../components/SignInButton";
import { CsrfContext } from '../../CrsfContext';

export const DesktopAdmin = () => {
  const [inventoryData, setInventoryData] = useState([]);
  // Track a separate object for editing inventory counts.
  const [editedInventory, setEditedInventory] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const csrfToken = useContext(CsrfContext);
  const [selectedTag, setSelectedTag] = useState("All");
  const [userName, setUserName] = useState({ firstName: "User", lastName: "Name" });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaveConfirmed, setIsSaveConfirmed] = useState(false);

  // Toggle dialog (e.g., for sign-out box or confirmations)
  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const openDialog = () => setIsDialogOpen(true);

  const closeDialog = () => setIsDialogOpen(false);

  // Handle Employee Account Creation button click
  const handleCreateClick = () => {
    const emailInput = document.querySelector(".user-gmail-com"); 
    if (!emailInput.checkValidity()) { 
      emailInput.reportValidity();
      return;
    }
    openDialog();
  };

  // Simulate confirming account creation
  const confirmCreation = () => {
    setIsConfirmed(true);  
    setTimeout(() => {
      document.querySelector(".dialog-overlay").classList.add("hidden");
      setTimeout(() => {
        setIsConfirmed(false);
        closeDialog();
      }, 500);
    }, 3000);
  };

  // Handle increment/decrement of inventory
  const handleInventoryChange = (partNumber, change) => {
    setEditedInventory(prevState => ({
      ...prevState,
      [partNumber]: Math.max(0, (prevState[partNumber] || 0) + change)
    }));
  };

  // Fetch user data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUserName(JSON.parse(stored));
    }
  }, []);

  // Fetch inventory data from Google Sheets via your backend endpoint
  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        const response = await fetch("/api/sheets-data");
        const data = await response.json();

        // Ensure data.values exists and has at least one data row (assuming first row is headers)
        if (data.values && data.values.length > 1) {
          const [headers, ...rows] = data.values;
          const mappedData = rows.map(row => {
            const item = {};
            headers.forEach((header, index) => {
              if (header.toLowerCase().includes("drawer number")) {
                item.productName = row[index];
              } else if (header.toLowerCase().includes("item number")) {
                item.partNumber = row[index];
              } else if (header.toLowerCase().includes("inventory amount")) {
                item.inventoryAmount = Number(row[index]);
              }
            });
            return item;
          });
          // Add tags for filtering
          const inventoryWithTags = mappedData.map(item => ({
            ...item,
            tags: item.productName && item.productName.includes("Resistor")
              ? "Electronics"
              : item.productName && item.productName.includes("Test Tubes")
              ? "Chemicals"
              : "Hardware"
          }));
          setInventoryData(inventoryWithTags);
          // Also initialize the editedInventory state based on retrieved data
          const initialEdits = inventoryWithTags.reduce((acc, item) => {
            acc[item.partNumber] = item.inventoryAmount;
            return acc;
          }, {});
          setEditedInventory(initialEdits);
        }
      } catch (err) {
        console.error("Error fetching sheet data:", err);
      }
    };

    fetchSheetData();
  }, []);

  // Derived filtered and sorted data (based on tags, search query, and sort option)
  const inventoryWithTags = inventoryData.map(item => ({
    ...item,
    tags: item.productName.includes("Resistor")
      ? "Electronics"
      : item.productName.includes("Test Tubes")
      ? "Chemicals"
      : "Hardware"
  }));

  const filteredData = inventoryWithTags.filter(item =>
    (selectedTag === "All" || item.tags === selectedTag) &&
    (item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOption === "default") return 0;
    if (sortOption === "lowToHigh") return a.inventoryAmount - b.inventoryAmount;
    if (sortOption === "highToLow") return b.inventoryAmount - a.inventoryAmount;
    return 0;
  });

  // Save changes by updating Google Sheets via your update endpoint
  const saveSheetData = async (updatedData) => {
    try {
      const response = await fetch("/api/update-sheet", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify(updatedData)
      });
      const result = await response.json();
      if (result.status === "success") {
        console.log("Sheet updated successfully");
      } else {
        console.error("Error updating sheet:", result.error);
      }
    } catch (error) {
      console.error("Error in update POST:", error);
    }
  };

  // Toggle edit mode. When leaving edit mode, save changes.
  const toggleEdit = async () => {
    if (isEditing) {
      // Prepare the updated data for the backend update.
      const updatedData = inventoryData.map(item => ({
        ...item,
        inventoryAmount: editedInventory[item.partNumber] || item.inventoryAmount
      }));

      // Call the update endpoint.
      await saveSheetData(updatedData);

      // Update local state after successful update
      setInventoryData(updatedData);
      localStorage.setItem("inventoryData", JSON.stringify(updatedData));

      // Show a confirmation dialog
      setIsSaveConfirmed(true);
      setIsDialogOpen(true);

      setTimeout(() => {
        setIsDialogOpen(false);
        setTimeout(() => {
          setIsSaveConfirmed(false);
          setIsEditing(false);
        }, 500);
      }, 3000);
    } else {
      setIsEditing(true);
    }
  };

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
            <div className="frame-7" onClick={toggleEdit}>
              <div className="text-wrapper-7">{isEditing ? "Save" : "Edit"}</div>
            </div>
            <FontAwesomeIcon icon={faUser} className="user-icon" size="lg" onClick={toggleDialog} />
          </div>
        </div>
        <div className="frame-8">
          <div className="text-wrapper-8">Admin Settings</div>
          <div className="frame-9">
            <div className="text-wrapper-9">Create Employee Account :</div>
            <form className="overlap-group-wrapper" onSubmit={(e) => e.preventDefault()}>
              <div className="user-gmail-com-wrapper">
                <input 
                  type="email" 
                  className="user-gmail-com" 
                  placeholder="user@aptitudemedical.com" 
                  pattern="[\-a-zA-Z0-9~!$%^&amp;*_=+\}\{'?]+(\.[\-a-zA-Z0-9~!$%^&amp;*_=+\}\{'?]+)*@[a-zA-Z0-9_][\-a-zA-Z0-9_]*(\.[\-a-zA-Z0-9_]+)*\.[cC][oO][mM](:[0-9]{1,5})?"
                  title="Please enter a valid email address"
                  required 
                />
              </div>
              <button type="button" className="sign-in-button-instance" onClick={handleCreateClick}>
                <div className="overlap-group">
                  <div className="sign-in">Create</div>
                </div>
              </button>
            </form>
          </div>
          <div className={`sign-out-container ${isOpen ? "show" : ""}`}>
            <SignOutBox
              firstName={userName.firstName}
              lastName={userName.lastName}
              csrfToken={csrfToken}
            />
          </div>
        </div>
        <div className="hero">
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
                  <td className="item-cell">
                    {isEditing ? (
                      <div className="inventory-edit">
                        <button onClick={() => handleInventoryChange(item.partNumber, -1)}>-</button>
                        <span className="inventory-number">
                          {editedInventory[item.partNumber] || item.inventoryAmount}
                        </span>
                        <button onClick={() => handleInventoryChange(item.partNumber, 1)}>+</button>
                      </div>
                    ) : (
                      <div className="inventory-number">
                        {editedInventory[item.partNumber] || item.inventoryAmount}
                      </div>
                    )}
                  </td>
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
        {isDialogOpen && (
          <div className="dialog-overlay">
            <div className="dialog-box">
              {isSaveConfirmed ? (
                <>
                  <div className="checkmark">✔</div>
                  <p className="success-message">Your changes have been saved.</p>
                </>
              ) : isConfirmed ? (
                <>
                  <div className="checkmark">✔</div>
                  <p className="success-message">
                    An email has been sent to the provided email address to complete account creation.
                  </p>
                </>
              ) : (
                <>
                  <h2>{isEditing ? "Confirm Save Changes" : "Confirm Employee Account Creation"}</h2>
                  <div className="dialog-buttons">
                    <button className="cancel-button" onClick={closeDialog}>
                      Cancel
                    </button>
                    <button className="confirm-button" onClick={isEditing ? toggleEdit : confirmCreation}>
                      Confirm
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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
                Home<br />Log In<br />Sign Up
              </div>
            </div>
          </div>
          <div className="frame-5">
            <div className="frame-3">
              <div className="text-wrapper-4">Contact</div>
            </div>
            <div className="frame-4">
              <div className="email-website">
                Email<br />Website<br />Instagram
              </div>
            </div>
          </div>
          <div className="frame-5">
            <div className="frame-4">
              <div className="text-wrapper-5">Help</div>
            </div>
            <div className="frame-3">
              <div className="support-FAQ">
                Support<br />FAQ
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

export default DesktopAdmin;