import React, { useState, useEffect } from 'react'
import './App.css';
import './global.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CsrfProvider } from './CrsfContext';
import DesktopHomePage from './pages/DesktopHome/DesktopHome';
import Login from './pages/DesktopLogin/DesktopLogin';
import Register from './pages/DesktopRegister/DesktopRegister'
import InventoryData from './pages/DesktopInventoryData/DesktopInventoryData'
import AdminPage from './pages/DesktopAdmin/DesktopAdmin';
import ManageAccounts from './pages/DesktopManageAccounts/DesktopManageAccounts.js'
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext.js';

const API = process.env.API_BASE_DEV;

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Example endpoint: your server's API or a public API
    fetch('/api/items')
      .then((response) => {
        if (!response.ok) {
          // Handle non-200 HTTP status
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json(); // Parse JSON
      })
      .then((jsonData) => {
        setData(jsonData);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
      });
  }, []);

  return (
    <Router>
      {/* Header would go here */}
      <CsrfProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<DesktopHomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/inventorydata" element={
              <ProtectedRoute requiredRole={"Employee"}>
                <InventoryData />
              </ProtectedRoute>
            } />
            <Route path="/adminpage" element={
              <ProtectedRoute requiredRole={"Admin"}>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path='/manageaccounts' element={
              <ProtectedRoute requiredRole={"Admin"}>
                <ManageAccounts />
              </ProtectedRoute>
            }/>
          </Routes>
        </AuthProvider>
      </CsrfProvider>
      {/* Footer would go here */}
    </Router>
  );
}

export default App;
