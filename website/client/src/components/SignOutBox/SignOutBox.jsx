import React, { useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./style.css";

export const SignOutBox = ({ firstName, lastName, csrfToken}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log("Logout initiated...");
      // Call the backend to log out
      const response = await fetch("/api/logout", {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken }
      });
      console.log("Logout response:", response);
      if (response.ok) {
        console.log("Logout successful.");
        // Clear user-specific data from localStorage and sessionStorage
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        navigate('/', {replace: true});
      } else { 
        console.error("Logout failed on the server.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  return (
    <div className="frame-001">
      <div className="div-001">
        <div className="div-002">
          <img className="element-001" src="../../../img/user-logo-circle.png" alt="Element" />

          <div className="text-wrapper-001">{firstName} {lastName}</div>
        </div>

        <div className="line-wrapper-001">
          <hr className="line-001" />
        </div>

        <div className="div-003" onClick={handleLogout}>
          <img src="../../../img/log-out.png" className="log-out-001" alt="Log out" />
          <div className="text-wrapper-002">Sign Out</div>
        </div>
      </div>
    </div>
  );
};
