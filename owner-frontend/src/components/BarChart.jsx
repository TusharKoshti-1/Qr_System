import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register all required elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement, // Ensure "point" is registered
  LineElement,  // Optional for compatibility
  Title,
  Tooltip,
  Legend
);

const BarChart = () => {
  const data = {
    labels: ["January", "February", "March", "April", "May", "June"],
    datasets: [
      {
        label: "Sales",
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Monthly Sales Data",
      },
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Months",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Sales",
        },
      },
    },
  };

  return (
    <div style={{ width: "60%", margin: "0 auto" }}>
      <Bar key={JSON.stringify(data)} data={data} options={options} />
    </div>
  );
};

export default BarChart;
