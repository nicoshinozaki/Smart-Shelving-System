const pool = require('./db');

(async () => {
    console.log(typeof process.env.DATABASE_PASSWORD)
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Current time from PostgreSQL:', res.rows[0]);
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } finally {
    pool.end();
  }
})();
