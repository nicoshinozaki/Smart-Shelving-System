// db.js
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  user: 'postgres',        // or your PostgreSQL user
  host: 'localhost',       // or your server IP
  database: 'users_db',    // the database name you created
  password: 'justin809254', // match the password you set
  port: 5432,              // default PostgreSQL port
});

module.exports = pool;
