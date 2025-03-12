const { pool, masterPool } = require('../db/config');
const express = require('express');
const router = express.Router();

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
    if (!admin || admin.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // 2. Connect to restaurant's database
    const restaurantDb = await pool.getConnection();
    await restaurantDb.query(`USE ??`, [admin[0].db_name]);

    // 3. Fetch menu
    const [menu] = await restaurantDb.query('SELECT id, name, price, image, category FROM menu');

    // 4. Fetch top items
    const topItems = await getTopItems(restaurantDb);
    const topItemNames = topItems.map(item => item.name);

    // 5. Add bestSeller flag to menu items
    const menuWithBestSellers = menu.map((item) => ({
      ...item,
      bestSeller: topItemNames.includes(item.name),
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

// Get top products (standalone endpoint)
router.get('/api/sales/top-products', authenticateAdmin, async (req, res) => {
  try {
    const restaurantDb = req.db; // Assuming authenticateAdmin sets this
    const topItems = await getTopItems(restaurantDb);

    const topProducts = topItems.map((item, index) => ({
      rank: index + 1,
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue,
      popularity: Math.min(100, item.quantity * 10), // Adjust as needed
    }));

    res.json(topProducts);
  } catch (err) {
    console.error('Error fetching top products:', err);
    res.status(500).json({ message: 'Database error' });
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