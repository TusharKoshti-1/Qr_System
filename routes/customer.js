const { pool, masterPool } = require('../db/config');
const express = require('express');
const router = express.Router();

// Get restaurant menu with best sellers
router.get('/api/customer/menu', async (req, res) => {
  const { restaurant_id } = req.query;

  try {
    // 1. Get restaurant database name from master DB
    const [admin] = await masterPool.query(
      'SELECT db_name FROM admins WHERE id = ?',
      [restaurant_id]
    );
    if (!admin || admin.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // 2. Connect to restaurant's database
    const restaurantDb = await pool.getConnection();
    await restaurantDb.query(`USE ??`, [admin[0].db_name]);

    // 3. Fetch menu
    const [menu] = await restaurantDb.query('SELECT id, name, price, image, category FROM menu');

    // 4. Fetch order data to determine best sellers
    const [orders] = await restaurantDb.query('SELECT items FROM orders WHERE items IS NOT NULL');
    const itemCounts = {};

    // Count occurrences of each item across all orders
    orders.forEach((order) => {
      try {
        const items = JSON.parse(order.items || '[]');
        if (Array.isArray(items)) {
          items.forEach((item) => {
            if (item.id) {
              itemCounts[item.id] = (itemCounts[item.id] || 0) + (item.quantity || 1);
            }
          });
        } else {
          console.warn(`Invalid items format in order: ${order.items}`);
        }
      } catch (parseError) {
        console.error(`Failed to parse items: ${order.items}`, parseError);
      }
    });

    // Sort items by count and get top 5
    const sortedItems = Object.entries(itemCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5) // Top 5 best sellers
      .map(([itemId]) => itemId);

    // 5. Add bestSeller flag to menu items
    const menuWithBestSellers = menu.map((item) => ({
      ...item,
      bestSeller: sortedItems.includes(String(item.id)),
    }));

    restaurantDb.release();
    res.json(menuWithBestSellers);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Error fetching menu' });
  }
});

// Create customer order (unchanged)
router.post('/api/customer/orders', async (req, res) => {
  const { customer_name, phone, items, total_amount, payment_method, restaurant_id } = req.body;

  if (!restaurant_id) {
    return res.status(400).json({ error: 'restaurant_id is required' });
  }

  try {
    const [admin] = await masterPool.query(
      'SELECT db_name FROM admins WHERE id = ?',
      [restaurant_id]
    );
    if (!admin || admin.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const restaurantDb = await pool.getConnection();
    try {
      await restaurantDb.query(`USE ??`, [admin[0].db_name]);

      const query = `
        INSERT INTO orders (customer_name, phone, items, total_amount, payment_method, status)
        VALUES (?, ?, ?, ?, ?, 'Pending')
      `;
      const [result] = await restaurantDb.query(query, [
        customer_name,
        phone,
        JSON.stringify(items),
        total_amount,
        payment_method,
      ]);
      const newOrder = {
        id: result.insertId,
        customer_name,
        phone,
        items,
        total_amount,
        payment_method,
        status: 'Pending',
      };
      req.wss.broadcast({ type: 'new_order', order: newOrder });

      res.json({ message: 'Order added successfully', orderId: result.insertId });
    } finally {
      restaurantDb.release();
    }
  } catch (error) {
    console.error('Order Error:', error);
    res.status(500).json({ error: 'Order failed' });
  }
});

// Get all distinct categories (unchanged)
router.get('/api/customer/categories', async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    const [admin] = await masterPool.query(
      'SELECT db_name FROM admins WHERE id = ?',
      [restaurant_id]
    );

    const restaurantDb = await pool.getConnection();
    await restaurantDb.query(`USE ??`, [admin[0].db_name]);

    const query = 'SELECT DISTINCT category FROM menu';
    const [results] = await restaurantDb.query(query);
    restaurantDb.release();
    const categories = results.map((row) => row.category);
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).send('Database error');
  }
});

// Get UPI ID (unchanged)
router.get('/api/customer/upiId', async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    const [admin] = await masterPool.query(
      'SELECT db_name FROM admins WHERE id = ?',
      [restaurant_id]
    );

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

// Get restaurant name (unchanged)
router.get('/api/customer/restaurant-name', async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    const [admin] = await masterPool.query(
      'SELECT db_name FROM admins WHERE id = ?',
      [restaurant_id]
    );

    const restaurantDb = await pool.getConnection();
    await restaurantDb.query(`USE ??`, [admin[0].db_name]);

    const query = 'SELECT restaurantName FROM settings';
    const [results] = await restaurantDb.query(query);
    restaurantDb.release();
    res.json(results[0].restaurantName);
  } catch (err) {
    console.error('Error fetching restaurant name:', err);
    res.status(500).json({ name: 'Our Restaurant' });
  }
});

module.exports = router;