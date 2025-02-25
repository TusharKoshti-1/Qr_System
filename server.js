const express = require('express');
const cors = require("cors");
const WebSocket = require("ws");
const helmet = require('helmet');  
const menuRoutes = require('./routes/menu'); 
const orderRoutes = require('./routes/order');
const salesRoutes = require('./routes/sales');
const path = require('path');
const MenuItems = require('./routes/menuitems');
const https = require("https");
const routes = require('./routes/routes');
const customer = require('./routes/customer');
const settings = require('./routes/settings');
const visitorInsights = require('./routes/visitorinsight');
const app = express();

const PORT = 5000;

// Serve static files from the "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://eleven-windows-cheat.loca.lt',
    'http://localhost:5000',
    'http://localhost:3001',
    'https://r21gqnrc-3000.inc1.devtunnels.ms',
    'https://qr-backend-tusharkoshti-1s-projects.vercel.app',
    'http://127.0.0.1:8080'
  ],
}));

// Increase payload size limits
app.use(express.json({ limit: '100mb' }));  // For JSON payloads
app.use(express.urlencoded({ limit: '100mb', extended: true }));  // For form data

// Debugging Content-Length header
app.use((req, res, next) => {
  console.log('Content-Length:', req.headers['content-length']);
  next();
});

// Use Helmet for security headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https://67f3-2409-40c1-5004-fc74-37ee-99ef-5e2b-10ad.ngrok-free.app/api/add-menuitem"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  })
);

// Create HTTPS server for secure WebSockets
const server = https.createServer(app);

// WebSocket server over HTTPS (wss://)
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket!");
  ws.send("Hello from the WebSocket server!");
});

// WebSocket broadcast function
wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Pass WebSocket server to routes
app.use((req, res, next) => {
  req.wss = wss;
  next();
});


// Route definitions
app.use(menuRoutes);
app.use(orderRoutes);
app.use(salesRoutes);
app.use(visitorInsights);
app.use(settings);
app.use(customer);
app.use(MenuItems);
app.use(routes);

// Start the server
// Start the server using HTTPS
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Secure WebSocket (wss://)`);
});