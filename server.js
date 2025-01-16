const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const WebSocket = require("ws");
const helmet = require('helmet');  // Include helmet
const menuRoutes = require('./routes/menu'); 
const orderRoutes = require('./routes/order');
const salesRoutes = require('./routes/sales')
const MenuItems = require('./routes/menuitems')

const app = express();
app.use(cors({
  origin: ['http://localhost:3000' , 'https://eleven-windows-cheat.loca.lt' , 'http://localhost:5000', 'http://localhost:3001', 'https://r21gqnrc-3000.inc1.devtunnels.ms' ], // Adjust to your frontend domain or localhost
}));
app.use(bodyParser.json());
// JSON and URL-encoded payloads
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Increase the payload size limit
app.use(express.json({ limit: '100mb' })); // For JSON payloads
app.use(express.urlencoded({ limit: '100mb', extended: true })); // For form data

app.use((req, res, next) => {
  console.log('Content-Length:', req.headers['content-length']);
  next();
});


// Use Helmet to set CSP
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https://67f3-2409-40c1-5004-fc74-37ee-99ef-5e2b-10ad.ngrok-free.app/api/add-menuitem"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      // Add any other resource types if necessary (like fonts, media, etc.)
    },
  })
);

// Initialize WebSocket server
const wss = new WebSocket.Server({ port: 5001 });
console.log('WebSocket server running on port 5001');

// Broadcast to all WebSocket clients
wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Middleware to pass `wss` to routes
app.use((req, res, next) => {
  req.wss = wss;
  next();
});

// Route definitions
app.use(menuRoutes);
app.use(orderRoutes);
app.use(salesRoutes);
app.use(MenuItems);

// Start the server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
   

