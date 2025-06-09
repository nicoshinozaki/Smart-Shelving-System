import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../api';
import './style.css';

export const SignOutBox = ({ firstName, lastName }) => {
  const navigate = useNavigate();
  const { apiFetch } = useApi();

  const handleLogout = async () => {
    try {
      console.log('Logout initiated...');

      // Use apiFetch to automatically include credentials and CSRF token
      const response = await apiFetch('/api/logout', { method: 'POST' });

      console.log('Logout response:', response);
      if (response.ok) {
        console.log('Logout successful.');
        // Clear user-specific data
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        navigate('/', { replace: true });
      } else {
        console.error('Logout failed on the server.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="frame-001">
      <div className="div-001">
        <div className="div-002">
          <img
            className="element-001"
            src="../../../img/user-logo-circle.png"
            alt="User"
          />
          <div className="text-wrapper-001">{firstName} {lastName}</div>
        </div>

        <div className="line-wrapper-001">
          <hr className="line-001" />
        </div>

        <div className="div-003" onClick={handleLogout}>
          <img
            src="../../../img/log-out.png"
            className="log-out-001"
            alt="Log out"
          />
          <div className="text-wrapper-002">Sign Out</div>
        </div>
      </div>
    </div>
  );
};