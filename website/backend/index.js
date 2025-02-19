const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db'); // from db.js
const fetch = require('node-fetch');
const app = express();
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// Testing Recieving Items from Database
app.get('/api/items', (req, res) => {
  const items = [
    { id: 1, name: 'Item One' },
    { id: 2, name: 'Item Two' },
  ];
  res.json(items);
});

// Testing Login Feature
// Example user for demonstration
const DUMMY_USER = {
  email: 'test@gmail.com',
  password: 'password123'
};

app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Insert into the database
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, hashedPassword]
    );

    // 3. Respond with user info (excluding password)
    const newUser = result.rows[0];
    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('Error in /api/register:', error);
    if (error.code === '23505') {
      // 23505 = unique_violation in PostgreSQL (duplicate email)
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// server/index.js (add this route)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // 2. Compare the incoming password with stored hash
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Password is correct! (Issue a session or JWT token here)
    // For now, just respond with success
    res.json({ message: 'Login successful', userId: user.id });
  } catch (error) {
    console.error('Error in /api/login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const { google } = require('googleapis');
const keys = require('./smart-shelving-unit-6c160c25d116.json');
app.get('/api/sheets-data', async (req, res) => {
  try {
    const spreadsheetId = '1fxyyb80V8hgieRpf1MKA9erwP-kD0SLwm6hdXIoRQ4M';
    const range = 'Sheet1!A1:C30';

    // Create a JWT client using your service account credentials
    const client = new google.auth.JWT(
      keys.client_email,
      null,
      keys.private_key,
      ['https://www.googleapis.com/auth/spreadsheets'] // scope for Google Sheets
    );

    // Authorize the client
    await client.authorize();

    // Create an instance of the Sheets API
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Fetch data from the specified range
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    res.json(result.data);
  } catch (error) {
    console.error('Error fetching sheets data:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
