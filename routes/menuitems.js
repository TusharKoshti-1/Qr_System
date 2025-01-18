const express = require('express');
const router = express.Router();
const connection = require('../db/config');
const multer = require('multer');


// Set up Multer for image upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage, 
  limits: { 
    fileSize: 20 * 1024 * 1024 
  } 
});

// API to fetch all menu items
router.get('/api/menuitems', (req, res) => {
  connection.query('SELECT * FROM MenuItems', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    // Convert the binary image data into Base64 string
    const menuItems = results.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      image: item.image ? `data:image/jpeg;base64,${item.image.toString("base64")}` : null
    }));
    res.json(menuItems);  // Return the processed menu items with base64 images
  });
});


// API to add a new menu item
router.post('/api/add-menuitem', upload.single('image'), (req, res) => {
    const { name, category } = req.body;
    const image = req.file ? req.file.buffer : null;
    console.log(image);
    console.log(req.file);

    if (!name || !category || !image) {
        return res.status(400).send('Name, category, and image are required.');
    }

    const query = 'INSERT INTO MenuItems (name, category, image) VALUES (?, ?, ?)';
    connection.query(query, [name, category, image], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        res.json({ message: 'Menu item added successfully' });
    });
});

// API to delete a menu item
router.delete('/api/remove-itemofmenu/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM MenuItems WHERE id = ?';
  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.json({ message: 'Menu item deleted successfully' });
  });
});

  module.exports = router;
  