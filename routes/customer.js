const { pool, masterPool } = require('../db/config');
const express = require('express');
const router = express.Router();


// Get restaurant menu
router.get('/api/customer/menu', async (req, res) => {
  const { restaurant_id } = req.query;

  try {
    // 1. Get restaurant database name from master DB
    const [admin] = await masterPool.query(
      'SELECT db_name FROM admins WHERE id = ?',
      [restaurant_id]
    );

    // 2. Connect to restaurant's database
    const restaurantDb = await pool.getConnection();
    await restaurantDb.query(`USE ??`, [admin[0].db_name]);

    // 3. Fetch menu
    const [menu] = await restaurantDb.query('SELECT * FROM menu');
    restaurantDb.release();

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching menu' });
  }
});

// Submit order
router.post('/api/customer/orders', async (req, res) => {
  const { restaurant_id, items } = req.body;

  try {
    // 1. Get restaurant database name from master DB
    const [admin] = await masterPool.query(
      'SELECT db_name FROM admins WHERE id = ?',
      [restaurant_id]
    );

    // 2. Connect to restaurant's database
    const restaurantDb = await pool.getConnection();
    await restaurantDb.query(`USE ??`, [admin[0].db_name]);

    // 3. Save order
    const [result] = await restaurantDb.query(
      'INSERT INTO orders (items) VALUES (?)',
      [JSON.stringify(items)]
    );
    
    restaurantDb.release();
    res.json({ orderId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Order failed' });
  }
});

// API to get all distinct categories
router.get('/api/customer/categories', async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    // 1. Get restaurant database name from master DB
    const [admin] = await masterPool.query(
      'SELECT db_name FROM admins WHERE id = ?',
      [restaurant_id]
    );

    // 2. Connect to restaurant's database
    const restaurantDb = await pool.getConnection();
    await restaurantDb.query(`USE ??`, [admin[0].db_name]);


    const query = 'SELECT DISTINCT category FROM menu';
    const [results] = await restaurantDb.query(query);
    restaurantDb.release();
    const categories = results.map(row => row.category);
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).send('Database error');
  }
});

module.exports = router;