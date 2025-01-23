const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`User logged in: ${email} \n ${password}`);
  // In real production code, you’d check a database, hash passwords, etc.
  if (email === DUMMY_USER.email && password === DUMMY_USER.password) {
    // For a real app, issue a secure token (like a JWT)
    return res.status(200).json({ message: 'Login successful', token: 'abc123token' });
  } else {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
});