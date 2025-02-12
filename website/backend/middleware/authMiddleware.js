const jwt = require('jsonwebtoken');
const redis = require('redis');
const client = redis.createClient();


function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Check if the token is blacklisted
  client.get(token, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (result === 'blacklisted') {
      return res.status(403).json({ error: 'Forbidden: Token has been invalidated' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach user info to the request object
      next();
    } catch (error) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
  });
}

module.exports = authenticateToken;