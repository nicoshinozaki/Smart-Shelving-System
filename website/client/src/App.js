import React, {useState, useEffect} from 'react'
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CsrfProvider } from './CrsfContext';
import HomePage from './HomePage';
import Login from './LoginForm';
import Register from './RegisterForm'
import InventoryData from './InventoryData'
import ProtectedRoute from './ProtectedRoute';

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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/inventorydata" element={
            <ProtectedRoute>
              <InventoryData/>
            </ProtectedRoute>
          }/>
          </Routes>
      </CsrfProvider>
      {/* Footer would go here */}
    </Router>
  );
}

export default App;
