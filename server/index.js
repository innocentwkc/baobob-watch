// index.js
import express from 'express';
import cors from 'cors';
import tcpPingRouter from './routes/tcpPingRouter.js';
import icmpPingRouter from './routes/icmpPingRouter.js';

/**
 * Creates an Express application and sets up a route for performing TCP pings.
 */
const app = express();
app.use(express.json());
app.use(cors());  // Enable CORS for all routes

// Use the routers
app.use('/tcp-ping', tcpPingRouter);
app.use('/icmp-ping', icmpPingRouter);

// Server configuration
const port = 4000;

/**
 * Starts the server on the specified port.
 */
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
