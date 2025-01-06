import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line, Bar } from "react-chartjs-2";
import "./Sales.css";

const Sales = () => {
  const [salesData, setSalesData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [topProducts, setTopProducts] = useState([]);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("daily"); // Options: 'daily', 'weekly', 'monthly'

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const dailyResponse = await axios.get("http://localhost:5000/api/sales/daily");
        const weeklyResponse = await axios.get("http://localhost:5000/api/sales/weekly");
        const monthlyResponse = await axios.get("http://localhost:5000/api/sales/monthly");
        const topProductsResponse = await axios.get("http://localhost:5000/api/sales/top-products");

        setSalesData({
          daily: dailyResponse.data,
          weekly: weeklyResponse.data,
          monthly: monthlyResponse.data,
        });
        setTopProducts(topProductsResponse.data);
        setError("");
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError("Failed to load sales data. Please try again later.");
      }
    };

    fetchSalesData();
  }, []);

  const calculateTotalRevenue = (data) =>
    data.reduce((sum, order) => sum + parseFloat(order.total_revenue || 0), 0).toFixed(2);

  const calculateTotalOrders = (data) => data.length;

  const salesViewData = salesData[viewMode] || [];

  // Chart data for Visitor Insights (using static data for demonstration)
  const visitorData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Loyal Customers",
        data: [200, 250, 300, 350, 300, 400, 380, 370, 360, 340, 330, 310],
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        fill: true,
      },
      {
        label: "New Customers",
        data: [100, 150, 120, 200, 180, 250, 240, 220, 210, 200, 190, 180],
        borderColor: "#f87171",
        backgroundColor: "rgba(248, 113, 113, 0.2)",
        fill: true,
      },
      {
        label: "Unique Customers",
        data: [150, 200, 250, 270, 260, 300, 310, 300, 290, 280, 270, 260],
        borderColor: "#34d399",
        backgroundColor: "rgba(52, 211, 153, 0.2)",
        fill: true,
      },
    ],
  };

  // Chart data for Total Revenue (using dynamic data for demonstration)
  const revenueData = {
    labels: ["Monday", "Thursday", "Sunday"],
    datasets: [
      {
        label: "Online Sales",
        data: [15000, 25000, 20000], // Replace this with API-driven data if available
        backgroundColor: "#3b82f6",
      },
      {
        label: "Offline Sales",
        data: [8000, 12000, 18000], // Replace this with API-driven data if available
        backgroundColor: "#22c55e",
      },
    ],
  };

  return (
    <div className="sales-container">
      <h1>Sales Analytics</h1>
      <div className="view-mode-buttons">
        <button
          className={viewMode === "daily" ? "active" : ""}
          onClick={() => setViewMode("daily")}
        >
          Daily
        </button>
        <button
          className={viewMode === "weekly" ? "active" : ""}
          onClick={() => setViewMode("weekly")}
        >
          Weekly
        </button>
        <button
          className={viewMode === "monthly" ? "active" : ""}
          onClick={() => setViewMode("monthly")}
        >
          Monthly
        </button>
      </div>
      {error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          <div className="sales-summary">
            <div className="sales-card total-sales">
              <div className="icon">📊</div>
              <div className="details">
                <h2>₹{calculateTotalRevenue(salesViewData)}</h2>
                <p>Total Sales</p>
                <small>Last day +8%</small>
              </div>
            </div>
            <div className="sales-card total-orders">
              <div className="icon">📝</div>
              <div className="details">
                <h2>{calculateTotalOrders(salesViewData)}</h2>
                <p>Total Orders</p>
                <small>Last day +5%</small>
              </div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart visitor-insights">
              <h2>Visitor Insights</h2>
              <Line data={visitorData} />
            </div>
            <div className="chart total-revenue">
              <h2>Total Revenue</h2>
              <Bar data={revenueData} />
            </div>
          </div>

          <div className="top-products">
            <h2>Top Products</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Popularity</th>
                  <th>Sales</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.rank}>
                    <td>{product.rank}</td>
                    <td>{product.name}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            height: "8px",
                            width: `${product.popularity}%`,
                            backgroundColor: "blue",
                            borderRadius: "4px",
                            marginRight: "10px",
                          }}
                        ></div>
                        <span>{product.popularity}%</span>
                      </div>
                    </td>
                    <td>₹{product.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Sales;
