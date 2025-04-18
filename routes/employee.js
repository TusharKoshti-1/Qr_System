const express = require("express");
const router = express.Router();
const { authenticateAdmin } = require('../middleware/middleware');

// Fetch all employees (no WebSocket needed)
router.get('/api/employees', authenticateAdmin, async (req, res) => {
  try {
    const query = `SELECT * FROM users`;
    const [results] = await req.db.query(query);

    const processedResults = results.map(employees => {
      return employees;
    });

    res.json(processedResults);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).send('Database error');
  }
});

// Delete an employee
router.delete("/api/employees/:id", authenticateAdmin, async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // First verify order exists
    const [checkResult] = await req.db.query(
      "SELECT id FROM users WHERE id = ?",
      [employeeId]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Delete order from database
    const [result] = await req.db.query(
      "DELETE FROM orders WHERE id = ?",
      [employeeId]
    );

    // Broadcast deletion to WebSocket clients
    req.wss.broadcast({ 
      type: "delete_employee", 
      id: employeeId 
    });

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).send("Database error");
  }
});

module.exports = router;