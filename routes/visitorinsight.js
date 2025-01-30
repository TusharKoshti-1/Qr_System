const express = require("express");
const router = express.Router();
const connection = require("../db/config");  // Import the database connection

// API endpoint to get visitor insights
router.get('/visitor-insights', async (req, res) => {
    try {
        // Get customer insights for each month (January to December)
        const insights = await getVisitorInsightsData(connection);  // Pass the connection to the function

        // Return the insights data as a JSON response
        res.json(insights);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
});

// Function to calculate visitor insights
async function getVisitorInsightsData(connection) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'
    ];

    const visitorInsights = {
        'loyal customers': [],
        'new customers': [],
        'unique customers': [],
    };

    // Loop through each month (1 to 12)
    for (let month = 1; month <= 12; month++) {
        const year = new Date().getFullYear();  // Current year

        // Get loyal customers for the given month (placed more than 5 orders)
        const loyalQuery = `
            SELECT customer_name
            FROM orders
            WHERE MONTH(created_on) = ? AND YEAR(created_on) = ?
            GROUP BY customer_name
            HAVING COUNT(id) > 5
        `;
        const loyalResult = await connection.execute(loyalQuery, [month, year]);
        console.log('Loyal Result:', loyalResult);  // Log the result to debug
        const loyalRows = loyalResult._rows;  // Access the _rows property directly
        visitorInsights['loyal customers'].push(loyalRows.length);

        // Get new customers for the given month (first order in this month)
        const newQuery = `
            SELECT customer_name
            FROM orders
            WHERE MONTH(created_on) = ? AND YEAR(created_on) = ?
            GROUP BY customer_name
            HAVING MIN(created_on) BETWEEN ? AND ?
        `;
        const newResult = await connection.execute(newQuery, [
            month, year,
            new Date(year, month - 1, 1),  // First day of the current month
            new Date(year, month, 0),  // Last day of the current month
        ]);
        console.log('New Result:', newResult);  // Log the result to debug
        const newRows = newResult._rows;  // Access the _rows property directly
        visitorInsights['new customers'].push(newRows.length);

        // Get unique customers for the given month (at least 1 order)
        const uniqueQuery = `
            SELECT DISTINCT customer_name
            FROM orders
            WHERE MONTH(created_on) = ? AND YEAR(created_on) = ?
        `;
        const uniqueResult = await connection.execute(uniqueQuery, [month, year]);
        console.log('Unique Result:', uniqueResult);  // Log the result to debug
        const uniqueRows = uniqueResult._rows;  // Access the _rows property directly
        visitorInsights['unique customers'].push(uniqueRows.length);
    }

    return visitorInsights;
}

module.exports = router;
