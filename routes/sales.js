const express = require("express");
const router = express.Router();
const connection = require("../db/config");

// Fetch aggregated sales data
router.get("/api/sales", (req, res) => {
  const query = `
    SELECT 
      JSON_UNQUOTE(JSON_EXTRACT(items, '$[*].name')) AS name,
      SUM(JSON_UNQUOTE(JSON_EXTRACT(items, '$[*].quantity'))) AS quantity,
      SUM(JSON_UNQUOTE(JSON_EXTRACT(items, '$[*].price')) * JSON_UNQUOTE(JSON_EXTRACT(items, '$[*].quantity'))) AS revenue
    FROM orders
    WHERE status = 'Completed'
    GROUP BY name
    ORDER BY revenue DESC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      return res.status(500).send("Failed to load sales data.");
    }

    // Parse the results to ensure compatibility with the frontend
    const salesData = results.map((row) => ({
      name: row.name,
      quantity: parseInt(row.quantity, 10),
      revenue: parseFloat(row.revenue),
    }));

    res.json(salesData);
  });
});


router.get("/api/sales/daily", (req, res) => {
  const query = `
    SELECT items, SUM(total_amount) as total_revenue 
    FROM orders 
    WHERE status = 'Completed' AND DATE(created_on) = CURDATE()
    GROUP BY items
  `;
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

router.get("/api/sales/weekly", (req, res) => {
  const query = `
    SELECT items, SUM(total_amount) as total_revenue 
    FROM orders 
    WHERE status = 'Completed' AND DATE(created_on) = CURDATE()
    GROUP BY items
  `;
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

router.get("/api/sales/monthly", (req, res) => {
  const query = `
    SELECT items, SUM(total_amount) as total_revenue 
    FROM orders 
    WHERE status = 'Completed' AND DATE(created_on) = CURDATE()
    GROUP BY items
  `;
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});


// Fetch top products
router.get("/api/sales/top-products", (req, res) => {
  const query = `
    SELECT 
      JSON_UNQUOTE(JSON_EXTRACT(items, '$[*].name')) AS name,
      SUM(JSON_UNQUOTE(JSON_EXTRACT(items, '$[*].quantity'))) AS quantity,
      SUM(JSON_UNQUOTE(JSON_EXTRACT(items, '$[*].price')) * JSON_UNQUOTE(JSON_EXTRACT(items, '$[*].quantity'))) AS revenue
    FROM orders
    WHERE status = 'Completed'
    GROUP BY name
    ORDER BY quantity DESC
    LIMIT 10
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching top products:", err);
      return res.status(500).json({ message: "Database error" });
    }

    const topProducts = results.map((row, index) => ({
      rank: index + 1,
      name: row.name,
      quantity: parseInt(row.quantity, 10),
      revenue: parseFloat(row.revenue),
      popularity: Math.min(100, parseInt(row.quantity, 10) * 10), // Example metric for popularity
    }));

    res.json(topProducts);
  });
});


module.exports = router;
