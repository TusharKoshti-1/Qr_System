const express = require('express');
const { loginUser, signupUser } = require('../db/auth');
const { v4: uuidv4 } = require("uuid");
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const router = express.Router();

const masterDbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER, // MySQL Username
  password: process.env.DB_PASS, // MySQL Password
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectTimeout: 10000,
};

// Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  loginUser(email, password, res);
});

// Function to initialize new admin database
async function initializeAdminDatabase(dbName) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    connectTimeout: 10000,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS ??`, [dbName]);
  await connection.query(`USE ??`, [dbName]);

  // Create tables
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    )
  `);

  

  await connection.end();
}


router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Generate unique database name
    const dbName = `admin_${uuidv4().replace(/-/g, '')}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save admin to master database
    const masterConnection = await mysql.createConnection(masterDbConfig);
    await masterConnection.query(
      'INSERT INTO admins (username, email, password, db_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, dbName]
    );
    await masterConnection.end();

    // Create and initialize admin database
    await initializeAdminDatabase(dbName);

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
