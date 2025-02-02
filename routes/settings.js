const express = require("express");
const router = express.Router();
const connection = require("../db/config");  // Import the database connection



// GET settings API: returns the single settings row,
// or inserts a default settings record if none exists.
router.get('/api/settings', (req, res) => {
    const query = 'SELECT * FROM settings LIMIT 1';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching settings:', err);
        return res.status(500).send('Database error');
      }
      if (results.length === 0) {
        // No settings found, insert default settings
        const defaultSettings = {
          restaurantName: 'My Restaurant',
          address: '123 Main Street',
          phone: '123-456-7890',
          email: 'example@example.com',
          operatingHours: '9 AM - 9 PM',
          taxRate: 10.00,
          isOpen: true,
        };
  
        const insertQuery = `
          INSERT INTO settings (restaurantName, address, phone, email, operatingHours, taxRate, isOpen)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        connection.query(
          insertQuery,
          [
            defaultSettings.restaurantName,
            defaultSettings.address,
            defaultSettings.phone,
            defaultSettings.email,
            defaultSettings.operatingHours,
            defaultSettings.taxRate,
            defaultSettings.isOpen,
          ],
          (insertErr, insertResult) => {
            if (insertErr) {
              console.error('Error inserting default settings:', insertErr);
              return res.status(500).send('Database error');
            }
            // Add the generated id to the default settings and return it
            defaultSettings.id = insertResult.insertId;
            res.json(defaultSettings);
          }
        );
      } else {
        res.json(results[0]);
      }
    });
  });
  
  // PUT settings API: updates the settings row (assuming id = 1)
router.put('/api/settings', (req, res) => {
    const { restaurantName, address, phone, email, operatingHours, taxRate, isOpen } = req.body;
    const query = `
      UPDATE settings
      SET restaurantName = ?, address = ?, phone = ?, email = ?, operatingHours = ?, taxRate = ?, isOpen = ?
      WHERE id = 1
    `;
    connection.query(
      query,
      [restaurantName, address, phone, email, operatingHours, taxRate, isOpen],
      (err, result) => {
        if (err) {
          console.error('Error updating settings:', err);
          return res.status(500).send('Database error');
        }
        res.json({ message: 'Settings updated successfully' });
      }
    );
  });
  
  
module.exports = router;
