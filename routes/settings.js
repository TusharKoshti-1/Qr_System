const express = require("express");
const router = express.Router();
const { masterPool } = require('../db/config');
const jwt = require('jsonwebtoken');
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
    const { restaurantName, address, phone, email, operatingHours, upiId, isOpen } = req.body;
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
  const token = req.headers.authorization?.split(' ')[1];
  try {
    // 1. Verify environment configuration
    if (!process.env.WEB_URL) {
      throw new Error('WEB_URL environment variable not configured');
    }

    // 2. Fetch restaurant settings with error handling
    const [settings] = await req.db.query(`
      SELECT restaurantName, address, upiId 
      FROM settings 
      LIMIT 1
    `);

    if (!settings?.length) {
      return res.status(404).json({ 
        error: 'Restaurant settings not found',
        solution: 'Configure restaurant settings first'
      });
    }

    const restaurant = settings[0];

    // 3. Validate required fields
    if (!restaurant.restaurantName || !restaurant.address) {
      throw new Error('Incomplete restaurant information in settings');
    }

    // 4. Construct secure URL with validation
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connection = await masterPool.getConnection();
    const [rows] = await connection.query(
      `SELECT id FROM admins WHERE db_name = ?`, 
      [decoded.dbName]
    );
    if (!rows || rows.length === 0) {
      throw new Error('No restaurant found for this database');
  }
    const restaurantId = rows[0].id;
    if (!Number.isInteger(restaurantId)) {
      throw new Error('Invalid restaurant ID format');
  }
    if (!restaurantId) {
      throw new Error('Invalid restaurant identification');
    }

    const url = new URL(`${process.env.WEB_URL}/welcome`);
    url.searchParams.set('restaurant_id', restaurantId);
    
    // 5. Generate QR code with error handling
    const qrImage = await qrcode.toDataURL(url.toString(), {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8
    });

    res.json({
      qrImage,
      restaurantName: restaurant.restaurantName,
      address: restaurant.address,
      upiId: restaurant.upiId
    });

  } catch (error) {
    console.error('[QR Generation Error]', {
      message: error.message,
      stack: error.stack,
      adminId: req.admin?.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: 'QR generation failed',
      debugInfo: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
  finally {
    // Always release connection back to pool
    connection.release();
}
});

router.get('/api/restaurant-name', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await req.db.query(
      'SELECT restaurantName FROM settings LIMIT 1'
    );
    
    res.json({
      name: results[0]?.restaurantName || 'Our Restaurant'
    });
  } catch (err) {
    console.error('Error fetching restaurant name:', err);
    res.status(500).json({ name: 'Our Restaurant' });
  }
});

  
  
module.exports = router;
