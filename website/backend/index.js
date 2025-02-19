// Required modules
const https = require('https');
const fs = require('fs');
const path = require('path'); // Needed for joining paths
const express = require('express');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db'); // from db.js
const fetch = require('node-fetch');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const keys = require('./smart-shelving-unit-6c160c25d116.json');
require('dotenv').config();

const app = express();

// ------------------------------
// Middleware
// ------------------------------
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ------------------------------
// API Routes
// ------------------------------

// Set up CSRF protection middleware; store the token in a cookie
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Example route to send the CSRF token to the client
app.get('/api/csrf-token', (req, res) => {
  // Send the token so that your client-side code can use it for subsequent requests
  res.json({ csrfToken: req.csrfToken() });
});

// Testing Receiving Items from Database
app.get('/api/items', (req, res) => {
  const items = [
    { id: 1, name: 'Item One' },
    { id: 2, name: 'Item Two' },
  ];
  res.json(items);
});

// Testing Login Feature
// Example user for demonstration (not used in actual login, just for reference)
const DUMMY_USER = {
  email: 'test@gmail.com',
  password: 'password123'
};

// Register Endpoint
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

// Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

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

    // 3. Generate a JWT token with expiration based on rememberMe
    const expiresIn = rememberMe ? '7d' : '10m';
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // 4. Set the token as an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true, // Cannot be accessed via JavaScript
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // Helps protect against CSRF
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 10 * 60 * 1000, // 7 days or 10 minutes (in ms)
    });

    // 5. Respond with success (do not return the token in JSON, since it's in the cookie)
    res.json({ message: 'Login successful', userId: user.id });
  } catch (error) {
    console.error('Error in /api/login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Google Sheets Data Endpoint
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

// ------------------------------
// Serve React Frontend
// ------------------------------

// Serve static files from the React app's build folder
app.use(express.static(path.join(__dirname, 'build')));

// For any route not handled by the API, send back React's index.html file.
// This supports client-side routing in React.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ------------------------------
// HTTPS Server Setup
// ------------------------------

// Load SSL certificate and private key (ensure these files exist in a 'certs' folder)
const privateKey = fs.readFileSync('./certs/key.pem', 'utf8');
const certificate = fs.readFileSync('./certs/cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Simple test route (if needed)
// app.get('/', (req, res) => {
//   res.json({ message: 'Hello from the server!' });
// });

// Start the HTTPS server on port 443
https.createServer(credentials, app).listen(443, () => {
  console.log('HTTPS Server running on port 443');
});
