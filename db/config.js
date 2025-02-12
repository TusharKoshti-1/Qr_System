const mysql = require('mysql2');
require('dotenv').config();  // This will load the .env variables

const connection = mysql.createConnection({
  host: process.env.DB_HOST, // Hostname provided by InfinityFree
  user: process.env.DB_USER,            // MySQL Username
  password: process.env.DB_PASS,          // MySQL Password
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,    // MySQL Database Name (replace XXX with your actual database name)
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

module.exports = connection;
