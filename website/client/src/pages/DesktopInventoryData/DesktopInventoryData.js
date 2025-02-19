import React, { useState, useEffect } from 'react';
//import './style.css';

function InventoryData() {
  const [sheetData, setSheetData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Adjust the URL if needed (e.g., include full domain for production)
    fetch('/api/sheets-data')
      .then(response => response.json())
      .then(data => {
        // Assuming your API returns data in the form:
        // { values: [ [ 'Header1', 'Header2' ], [ 'Row1Cell1', 'Row1Cell2' ], ... ] }
        if (data.values) {
          setSheetData(data.values);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching sheet data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Optionally, check if there is data
  if (!sheetData.length) {
    return <div>No data found.</div>;
  }

  return (
    <div>
      <h1>Google Sheet Data</h1>
      <table border="1">
        <thead>
          <tr>
            {/* Assuming first row contains headers */}
            {sheetData[0].map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Display rows excluding the header */}
          {sheetData.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryData;
