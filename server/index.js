// index.js
import express from 'express';
import { tcpPing } from './lib/tools/tcpPing.js';
import icmpPing from './lib/tools/icmpPing.js';

/**
 * Creates an Express application and sets up a route for performing TCP pings.
 */
const app = express();
app.use(express.json());

/**
 * Route to perform a TCP ping.
 * Accepts query parameters for host, ports, timeout, and cycles for the ping operation.
 * 
 * @param {express.Request} req - The Express request object, containing query parameters.
 * @param {express.Response} res - The Express response object, used to send back the ping results.
 */
app.get('/tcp-ping', (req, res) => {
  // Extracting query parameters and setting default values
  const { host, ports = '80', timeout, cycles } = req.query;

  // Parsing the ports string into an array of integers
  const parsedPorts = ports.split(',').map(port => parseInt(port.trim()));

  // Setting headers for an event stream response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Calling the tcpPing function and setting up event listeners
  const emitter = tcpPing(host, parsedPorts, parseInt(timeout), parseInt(cycles));
  
  emitter.on('data', (data) => {
    res.write(`data: ${data}\n\n`);
  });

  emitter.on('complete', (message) => {
    res.write(`data: ${message}\n\n`);
    res.end();
  });
});

/**
 * API route for performing an ICMP ping to a specified host.
 * This route accepts query parameters for 'host', 'timeout', and 'count'.
 * 
 * @param {express.Request} req - The Express request object, containing query parameters:
 *   - host (string): The IP address or hostname to be pinged.
 *   - timeout (string): The interval between each ping in milliseconds. Defaults to 5000ms.
 *   - count (string): The number of pings to send. Can be set to 'infinite' for indefinite pinging or a specific number. Defaults to 4.
 * @param {express.Response} res - The Express response object, used to send back the ping results.
 */
// Handler for the '/icmp-ping' route
app.get('/icmp-ping', (req, res) => {
  // Extract parameters from the query string
  const { host, timeout, count } = req.query;

  // Parse the timeout parameter, default to 5000 milliseconds if not provided or invalid
  const parsedTimeout = parseInt(timeout) || 5000;
  // Parse the count parameter. Use -1 for infinite pings if 'infinite' is specified, otherwise default to 4
  const parsedCount = count === 'infinite' ? -1 : parseInt(count) || 4;

  // Set response headers for an event stream format
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Invoke the icmpPing function and set up event listeners
  const emitter = icmpPing(host, parsedTimeout, parsedCount);

  // On receiving ping data, send it to the client
  emitter.on('data', (data) => {
    res.write(`data: ${data}\n\n`);
  });

  // On ping completion, send the completion message and close the connection
  emitter.on('complete', (message) => {
    res.write(`data: ${message}\n\n`); 
    res.end();
  });

  // On ping error, send the error message and close the connection
  emitter.on('error', (error) => {
    res.write(`data: Error: ${error.message}\n\n`);
    res.end();
  });

  // On timeout, send the timeout message to the client
  emitter.on('timeout', (timeoutMessage) => {
    res.write(`data: ${timeoutMessage}\n\n`);
  });
});

// Server configuration
const port = 4000;

/**
 * Starts the server on the specified port.
 */
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
