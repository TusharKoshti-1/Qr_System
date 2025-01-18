const express = require('express');
const router = express.Router();
const connection = require('../db/config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up Multer to store images in the "menu-items" directory
const uploadDir = path.join(__dirname, '../uploads/menu-items'); // Path to "menu-items" folder

// Ensure the upload directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files in the "menu-items" folder
  },
  filename: (req, file, cb) => {
    // Use the current timestamp + original file extension for unique filenames
    const fileExt = path.extname(file.originalname);
    const filename = Date.now() + fileExt;
    cb(null, filename); // Set the file name
  }
});

const upload = multer({ 
  storage: storage, 
  limits: { 
    fileSize: 20 * 1024 * 1024 // Limit file size to 20 MB
  } 
});

// API to fetch all menu items
router.get('/api/menuitems', (req, res) => {
  connection.query('SELECT * FROM MenuItems', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    
    // Map results to include the image URL
    const menuItems = results.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      // Construct the image URL from the file path stored in the database
      image: item.image ? `/uploads/menu-items/${path.basename(item.image)}` : null 
    }));
    console.log(menuItems.image);
    
    res.json(menuItems);  // Return the processed menu items with the image URL
  });
});


// API to add a new menu item
router.post('/api/add-menuitem', upload.single('image'), (req, res) => {
    const { name, category } = req.body;
    const imageFilePath = req.file ? req.file.path : null;  // Get the file path

    if (!name || !category || !imageFilePath) {
        return res.status(400).send('Name, category, and image are required.');
    }

    // Insert the menu item into the database (you can store the image path in the database)
    const query = 'INSERT INTO MenuItems (name, category, image) VALUES (?, ?, ?)';
    connection.query(query, [name, category, imageFilePath], (err, result) => {
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
