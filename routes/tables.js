const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/middleware');

// Add a new section
router.post('/api/sections', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Section name is required' });
    }

    const query = 'INSERT INTO sections (name) VALUES (?)';
    const [result] = await req.db.query(query, [name]);
    
    const newSection = {
      id: result.insertId,
      name,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    req.wss.broadcast({ type: 'new_section', section: newSection });
    res.status(201).json({ message: 'Section added successfully', sectionId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Section name already exists' });
    }
    console.error('Error adding section:', err);
    res.status(500).send('Database error');
  }
});

// Get all sections
router.get('/api/sections', authenticateAdmin, async (req, res) => {
  try {
    const query = 'SELECT * FROM sections ORDER BY name ASC';
    const [results] = await req.db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching sections:', err);
    res.status(500).send('Database error');
  }
});

// Delete a section (only if no tables exist in it)
router.delete('/api/sections/:id', authenticateAdmin, async (req, res) => {
  try {
    const sectionId = req.params.id;

    // Check if section has tables
    const [tables] = await req.db.query('SELECT COUNT(*) as count FROM tables WHERE section_id = ?', [sectionId]);
    if (tables[0].count > 0) {
      return res.status(400).json({ message: 'Cannot delete section with existing tables' });
    }

    const [result] = await req.db.query('DELETE FROM sections WHERE id = ?', [sectionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Section not found' });
    }

    req.wss.broadcast({ type: 'delete_section', id: sectionId });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting section:', err);
    res.status(500).send('Database error');
  }
});

// Add a new table
router.post('/api/tables', authenticateAdmin, async (req, res) => {
  try {
    const { table_number, status, section_id } = req.body;

    if (!table_number || !section_id) {
      return res.status(400).json({ message: 'Table number and section are required' });
    }

    // Check if table number already exists
    const [existing] = await req.db.query('SELECT id FROM tables WHERE table_number = ?', [table_number]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    const query = `
      INSERT INTO tables (table_number, status, section_id)
      VALUES (?, ?, ?)
    `;
    const [result] = await req.db.query(query, [
      table_number,
      status || 'empty',
      section_id,
    ]);

    const [section] = await req.db.query('SELECT name FROM sections WHERE id = ?', [section_id]);
    const newTable = {
      id: result.insertId,
      table_number,
      status: status || 'empty',
      section: section[0].name,
      section_id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    req.wss.broadcast({ type: 'new_table', table: newTable });
    res.status(201).json({ message: 'Table added successfully', tableId: result.insertId });
  } catch (err) {
    console.error('Error adding table:', err);
    res.status(500).send('Database error');
  }
});

// Fetch all tables
router.get('/api/tables', authenticateAdmin, async (req, res) => {
  try {
    const query = `
      SELECT t.*, s.name as section 
      FROM tables t 
      JOIN sections s ON t.section_id = s.id 
      ORDER BY s.name, t.table_number ASC
    `;
    const [results] = await req.db.query(query);

    const processedResults = results.map((table) => ({
      id: table.id,
      table_number: table.table_number,
      status: table.status,
      section: table.section,
      section_id: table.section_id,
      created_at: table.created_at,
      updated_at: table.updated_at,
    }));

    res.json(processedResults);
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).send('Database error');
  }
});

// Update a table
router.put('/api/tables/:id', authenticateAdmin, async (req, res) => {
  try {
    const tableId = req.params.id;
    const { status, section_id } = req.body;

    if (!status && !section_id) {
      return res.status(400).json({ message: 'Status or section is required' });
    }

    const [section] = await req.db.query('SELECT name FROM sections WHERE id = ?', [section_id]);
    if (!section.length) {
      return res.status(400).json({ message: 'Invalid section ID' });
    }

    const query = 'UPDATE tables SET status = ?, section_id = ? WHERE id = ?';
    const [result] = await req.db.query(query, [
      status || 'empty',
      section_id,
      tableId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const updatedTable = { 
      id: tableId, 
      status, 
      section: section[0].name,
      section_id 
    };
    req.wss.broadcast({ type: 'update_table', table: updatedTable });
    res.json({ message: 'Table updated successfully' });
  } catch (err) {
    console.error('Error updating table:', err);
    res.status(500).send('Database error');
  }
});

// Delete a table
router.delete('/api/tables/:id', authenticateAdmin, async (req, res) => {
  try {
    const tableId = req.params.id;

    const [checkResult] = await req.db.query(`
      SELECT t.id, t.table_number, s.name as section 
      FROM tables t 
      JOIN sections s ON t.section_id = s.id 
      WHERE t.id = ?
    `, [tableId]);
    
    if (checkResult.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const { table_number, section } = checkResult[0];
    const [result] = await req.db.query('DELETE FROM tables WHERE id = ?', [tableId]);

    req.wss.broadcast({ type: 'delete_table', id: tableId, table_number, section });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting table:', err);
    res.status(500).send('Database error');
  }
});

module.exports = router;