const express = require('express');
const router = express.Router();
const connection = require('../db/config');
const { authenticateAdmin } = require('../middleware/middleware');

// API to fetch all menu items
router.get('/api/menu', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await req.db.query('SELECT * FROM menu');
    const menu = results.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      price: item.price,
      category: item.category,
    }));
    res.json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// API to fetch top-selling items
router.get('/api/top-sellers', authenticateAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id,
        m.name,
        m.image,
        m.price,
        m.category,
        SUM(oi.quantity) as quantitySold
      FROM menu m
      LEFT JOIN order_items oi ON m.id = oi.menu_item_id
      GROUP BY m.id, m.name, m.image, m.price, m.category
      ORDER BY quantitySold DESC
      LIMIT 10
    `;
    const [results] = await req.db.query(query);

    const topSellers = results.map((item, index) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      price: item.price,
      category: item.category,
      quantitySold: item.quantitySold || 0, // Handle NULL values
      rank: index + 1, // Assign rank based on position
    }));

    res.json(topSellers);
  } catch (err) {
    console.error('Error fetching top sellers:', err);
    res.status(500).send('Database error');
  }
});

// API to add a new menu item
router.post('/api/add-item', authenticateAdmin, async (req, res) => {
  try {
    const { name, image, price, category } = req.body;
    const query = 'INSERT INTO menu (name, image, price, category) VALUES (?, ?, ?, ?)';
    await req.db.query(query, [name, image, price || 0, category]);
    res.json({ message: 'Menu item added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// API to update an item's price
router.put('/api/update-item/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const query = 'UPDATE menu SET price = ? WHERE id = ?';
    await req.db.query(query, [price, id]);
    res.json({ message: 'Menu item updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// API to delete a menu item
router.delete('/api/delete-item/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM menu WHERE id = ?';
    await req.db.query(query, [id]);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// API to get all distinct categories
router.get('/api/categories', authenticateAdmin, async (req, res) => {
  try {
    const query = 'SELECT DISTINCT category FROM menu';
    const [results] = await req.db.query(query);
    const categories = results.map((row) => row.category);
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).send('Database error');
  }
});

module.exports = router;