const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const connectDB = require('./config/database');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' } });
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const app = express();
const authenticateToken = require('./middleware/authMiddleware');
const redis = require('redis');
const client = redis.createClient();
console.log('MongoDB URI:', process.env.MONGO_URI);
client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

(async () => {
  try {
    await client.connect();
    console.log('Connected to Redis successfully');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
  }
})();
// Middleware
const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));  // Limit request body to 10KB
app.use(csrfProtection);
// Provide CSRF token to frontend
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = req.csrfToken();
  res.json({ csrfToken });
});


// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,  // Limit each IP to 5 login attempts
  message: 'Too many login attempts. Please try again later.',
});
// Connect to database
connectDB().then(db => {
  console.log("Connected to MongoDB successfully.");

  // Home route after successful DB connection
  app.get('/', async (req, res) => {
    try {
      const collections = await db.listCollections().toArray();
      res.json({ message: "Connected successfully", collections });
    } catch (error) {
      res.status(500).json({ message: "Error fetching collections", error });
    }
  });
  const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
  };
  https.createServer(options, app).listen(5000, () => {
    console.log('Secure server running on https://localhost:5000');
  });
  app.get('/api/items', (req, res) => {
    const items = [
      { id: 1, name: 'Item One' },
      { id: 2, name: 'Item Two' },
    ];
    res.json(items);
  });
  
  // User login route with bcrypt and JWT
  app.post('/api/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ email });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Compare the entered password with hashed password in DB
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not set in environment variables');
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // Secure cookies in production
        sameSite: 'Strict',  // Helps prevent CSRF
        maxAge: 3600000,  // 1 hour
      });

      res.status(200).json({ 
        message: "Login successful",
        csrfToken: req.csrfToken(),
        firstName: user.firstName,
        lastName: user.lastName,
      });

    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  

  
  app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: "Request is valid and token verified!", user: req.user });
  });
  app.post('/api/logout', async (req, res) => {
    console.log("🔵 Logout endpoint hit");
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(400).json({ message: 'No token provided' });
      }
  
      // 1) Decode the token, figure out expiry
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return res.status(400).json({ message: 'Invalid token' });
      }
  
      const remainingTime = decoded.exp * 1000 - Date.now();
      if (remainingTime <= 0) {
        return res.status(400).json({ message: 'Token expired' });
      }
  
      // 2) Blacklist it in Redis
      await client.set(token, 'blacklisted', {
        PX: remainingTime, // Use PX for milliseconds
      });
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
      });
      console.log("🟢 Token successfully blacklisted in Redis.");
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error("🔴 Error during logout:", error);
      return res.status(500).json({ error: 'Failed to process logout' });
    }
  });

}).catch(err => {
  console.error('Database connection failed:', err);
});

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
