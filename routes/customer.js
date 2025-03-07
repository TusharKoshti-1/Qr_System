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

router.post('/api/customer/orders', async (req, res) => {
  const { customer_name, phone, items, total_amount, payment_method, restaurant_id } = req.body; // ✅ Fix: Get restaurant_id from body

  if (!restaurant_id) {
    return res.status(400).json({ error: "restaurant_id is required" });
  }

  try {
    // 1. Get restaurant database name from master DB
    const [admin] = await masterPool.query(
      'SELECT db_name FROM admins WHERE id = ?',
      [restaurant_id]
    );

    if (!admin || admin.length === 0) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    console.log("Fetched restaurant database:", admin[0].db_name);

    // 2. Connect to restaurant's database
    const restaurantDb = await pool.getConnection();
    try {
      await restaurantDb.query(`USE ??`, [admin[0].db_name]);

      // 3. Save order
      const query = `
      INSERT INTO orders (customer_name, phone, items, total_amount, payment_method, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `;
    const [result] = await restaurantDb.query(query, [
      customer_name,
      phone,
      JSON.stringify(items),
      total_amount,
      payment_method
    ]);
    const newOrder = {
      id: result.insertId,
      customer_name,
      phone,
      items,
      total_amount,
      payment_method,
      status: 'Pending'
    };
    req.wss.broadcast({ type: "new_order", order: newOrder });

    res.json({ message: 'Order added successfully',orderId: result.insertId });
    } finally {
      restaurantDb.release(); // ✅ Fix: Always release connection
    }
  } catch (error) {
    console.error("Order Error:", error); // ✅ Fix: Log error details
    res.status(500).json({ error: "Order failed" });
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

router.get('/api/customer/upiId', async (req, res) => {
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


    const query = 'SELECT upiID FROM settings';
    const [results] = await restaurantDb.query(query);
    restaurantDb.release();
    res.json(results[0].upiID);
  } catch (err) {
    console.error('Error fetching upiID:', err);
    res.status(500).send('Database error');
  }
});


module.exports = router;