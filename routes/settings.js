const express = require("express");
const router = express.Router();
const connection = require("../db/config"); 
const qrcode = require('qrcode');
const { authenticateAdmin } = require('../middleware/middleware');


router.get('/api/settings', authenticateAdmin, async (req, res) => {
  try {
    const query = 'SELECT * FROM settings LIMIT 1';
    const [results] = await req.db.query(query);

    if (results.length === 0) {
      const defaultSettings = {
        restaurantName: 'My Restaurant',
        address: '123 Main Street',
        phone: '123-456-7890',
        email: 'example@example.com',
        operatingHours: '9 AM - 9 PM',
        upiId: '',
        isOpen: true,
      };

      const insertQuery = `
        INSERT INTO settings (restaurantName, address, phone, email, operatingHours, upiId, isOpen)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [insertResult] = await req.db.query(insertQuery, [
        defaultSettings.restaurantName,
        defaultSettings.address,
        defaultSettings.phone,
        defaultSettings.email,
        defaultSettings.operatingHours,
        defaultSettings.upiId,
        defaultSettings.isOpen
      ]);

      defaultSettings.id = insertResult.insertId;
      res.json(defaultSettings);
    } else {
      res.json(results[0]);
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).send('Database error');
  }
});

// PUT settings API
router.put('/api/settings', authenticateAdmin, async (req, res) => {
  try {
    const { restaurantName, address, phone, email, operatingHours, taxRate, isOpen } = req.body;
    const query = `
      UPDATE settings
      SET restaurantName = ?, address = ?, phone = ?, email = ?, operatingHours = ?, upiId = ?, isOpen = ?
      WHERE id = 1
    `;
    await req.db.query(query, [
      restaurantName,
      address,
      phone,
      email,
      operatingHours,
      upiId,
      isOpen
    ]);
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).send('Database error');
  }
});


// Generate QR code for restaurant
router.get('/api/generate-qr', authenticateAdmin, async (req, res) => {
  try {
    const url = `${import.meta.env.WEB_URL}/welcome?restaurant_id=${req.admin.id}`;
    const qrImage = await qrcode.toDataURL(url);
    res.json({ qrImage });
  } catch (error) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

  
  
module.exports = router;
