// db.js
const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
  user: process.env.DATABASE_USER,        // or your PostgreSQL user
  host: process.env.DATABASE_HOST,       // or your server IP
  database: process.env.DATABASE_NAME,    // the database name you created
  password: process.env.DATABASE_PASSWORD || '', // match the password you set
  port: process.env.DATABASE_PORT,              // default PostgreSQL port
  connectionString: process.env.DATABASE_URL
});

module.exports = pool;
