const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/middleware');

// Add a new table
router.post('/api/tables', authenticateAdmin, async (req, res) => {
  try {
    const { table_number, status } = req.body;

    if (!table_number) {
      return res.status(400).json({ message: 'Table number is required' });
    }

    const query = `
      INSERT INTO tables (table_number, status)
      VALUES (?, ?)
    `;
    const [result] = await req.db.query(query, [
      table_number,
      status || 'empty', // Default to 'empty' if not provided
    ]);

    const newTable = {
      id: result.insertId,
      table_number,
      status: status || 'empty',
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
    const query = `SELECT * FROM tables ORDER BY table_number ASC`;
    const [results] = await req.db.query(query);

    const processedResults = results.map((table) => ({
      id: table.id,
      table_number: table.table_number,
      status: table.status,
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
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const query = 'UPDATE tables SET status = ? WHERE id = ?';
    const [result] = await req.db.query(query, [status, tableId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const updatedTable = { id: tableId, status };
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

    // Verify table exists and get table_number
    const [checkResult] = await req.db.query('SELECT id, table_number FROM tables WHERE id = ?', [tableId]);
    if (checkResult.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const tableNumber = checkResult[0].table_number;

    // Delete table
    const [result] = await req.db.query('DELETE FROM tables WHERE id = ?', [tableId]);

    req.wss.broadcast({ type: 'delete_table', id: tableId, table_number: tableNumber });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting table:', err);
    res.status(500).send('Database error');
  }
});

module.exports = router;