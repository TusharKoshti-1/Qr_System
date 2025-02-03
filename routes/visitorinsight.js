const express = require("express");
const router = express.Router();
const connection = require("../db/config");  // Import the database connection

const dayjs = require('dayjs');

router.get("/api/customer-satisfaction", (req, res) => {
    const satisfactionQuery = `
      SELECT 
        DATE_FORMAT(created_on, '%Y-%m') AS month,
        WEEKDAY(created_on) AS day_of_week,
        COUNT(id) AS order_count,
        SUM(total_amount) AS total_amount
      FROM orders
      WHERE status = 'Completed'
        AND is_deleted = 0
        AND created_on >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      GROUP BY month, day_of_week
      ORDER BY month, day_of_week;
    `;
  
    connection.query(satisfactionQuery, (err, results) => {
      if (err) {
        console.error("Error fetching satisfaction data:", err);
        return res.status(500).json({ error: "Failed to load customer satisfaction data" });
      }
  
      // Initialize data structure for 7 days (Monday-Sunday)
      const satisfactionData = {
        'last month': new Array(7).fill(0),
        'this month': new Array(7).fill(0)
      };
  
      const currentMonth = dayjs().format('YYYY-MM');
      const lastMonth = dayjs().subtract(1, 'month').format('YYYY-MM');
  
      results.forEach(row => {
        const dayIndex = row.day_of_week; // WEEKDAY() returns 0-6 (Monday-Sunday)
        
        if (row.month === currentMonth) {
          satisfactionData['this month'][dayIndex] = row.order_count;
        } else if (row.month === lastMonth) {
          satisfactionData['last month'][dayIndex] = row.order_count;
        }
      });
  
      res.json(satisfactionData);
    });
  });

module.exports = router;
