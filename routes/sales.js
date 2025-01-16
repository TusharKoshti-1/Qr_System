const express = require("express");
const router = express.Router();
const connection = require("../db/config");

// Fetch aggregated sales data
router.get("/api/sales", (req, res) => {
  const query = `
    SELECT 
      item_details.name AS name,
      SUM(item_details.quantity) AS quantity,
      SUM(item_details.price * item_details.quantity) AS revenue
    FROM (
      SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(item, '$.name')) AS name,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(item, '$.quantity')) AS UNSIGNED) AS quantity,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(item, '$.price')) AS DECIMAL(10, 2)) AS price
      FROM orders
      JOIN JSON_TABLE(items, '$[*]' COLUMNS (
        item JSON PATH '$',
        name VARCHAR(255) PATH '$.name',
        quantity INT PATH '$.quantity',
        price DECIMAL(10, 2) PATH '$.price'
      )) AS item_details
      WHERE status = 'Completed' AND is_deleted = 0
    ) AS item_details
    GROUP BY item_details.name
    ORDER BY revenue DESC;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      return res.status(500).send("Failed to load sales data.");
    }

    // Format the results for the frontend
    const salesData = results.map((row) => ({
      name: row.name,
      quantity: parseInt(row.quantity, 10),
      revenue: parseFloat(row.revenue),
    }));

    res.json(salesData);
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
