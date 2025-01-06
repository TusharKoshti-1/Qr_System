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
  origin: ['http://localhost:3000' , 'https://eleven-windows-cheat.loca.lt' ], // Adjust to your frontend domain or localhost
}));
app.use(bodyParser.json());

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
   

