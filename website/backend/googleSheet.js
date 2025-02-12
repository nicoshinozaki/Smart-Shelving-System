// server/googleSheet.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// 1) Point to your service account JSON
const KEYFILEPATH = path.join(__dirname, 'smart-shelving-unit-4e010dcbef5a.json');

// 2) Scopes: read-only for public spreadsheet data
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// 3) Create a GoogleAuth instance
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

// 4) Function to retrieve sheet data
async function getSheetData(spreadsheetId, range) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  
  // API request
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId, // e.g. "1sdUIJ3kD-x..."
    range,         // e.g. "Sheet1!A1:D100"
  });
  
  // 'response.data.values' is an array of arrays
  const rows = response.data.values;
  console.log("Fetched rows from Google Sheets:\n", rows);
  return rows || [];
}

module.exports = { getSheetData };
