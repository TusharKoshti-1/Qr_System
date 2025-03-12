const { pool, masterPool } = require('../db/config');
const express = require('express');
const router = express.Router();
// const { authenticateAdmin } = require('../middleware/middleware');

// Helper function to calculate top items
async function getTopItems(restaurantDb) {
  try {
    // Query to unnest JSON items and aggregate
    const query = `
      SELECT 
        JSON_EXTRACT(item.value, '$.name') AS name,
        SUM(JSON_EXTRACT(item.value, '$.quantity')) AS quantity,
        SUM(JSON_EXTRACT(item.value, '$.price') * JSON_EXTRACT(item.value, '$.quantity')) AS revenue
      FROM orders
      CROSS JOIN JSON_TABLE(
        items,
        '$[*]' COLUMNS (
          value JSON PATH '$'
        )
      ) AS item
      WHERE status = 'Completed'
      GROUP BY name
      ORDER BY quantity DESC
      LIMIT 5
    `;
    const [results] = await restaurantDb.query(query);

    return results.map((row) => ({
      name: JSON.parse(row.name), // Remove quotes from stringified name
      quantity: parseInt(row.quantity, 10),
      revenue: parseFloat(row.revenue),
    }));
  } catch (err) {
    console.error('Error fetching top items:', err);
    return [];
  }
}

// Get restaurant menu with best sellers
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

// Get top sellers for customers
router.get('/api/customer/top-sellers', async (req, res) => {
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

    // 3. Fetch top items
    const topItems = await getTopItems(restaurantDb);

    // 4. Format response for customers
    const topSellers = topItems.map((item, index) => ({
      rank: index + 1,
      name: item.name,
      quantitySold: item.quantity,
      totalRevenue: item.revenue,
    }));

    restaurantDb.release();
    res.json(topSellers);
  } catch (error) {
    console.error('Error fetching top sellers:', error);
    res.status(500).json({ error: 'Error fetching top sellers' });
  }
});

// Create customer order
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
      const itemsJson = JSON.stringify(items);
      const [result] = await restaurantDb.query(query, [
        customer_name,
        phone,
        itemsJson,
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

// Get all distinct categories
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

// Get UPI ID
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

// Get restaurant name
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