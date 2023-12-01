import express from 'express';
import tcpPing from '../lib/tools/tcpPing.js';

const router = express.Router();

/**
 * Route to perform a TCP ping.
 * Accepts query parameters for host, ports, timeout, and cycles for the ping operation.
 * 
 * @param {express.Request} req - The Express request object, containing query parameters.
 * @param {express.Response} res - The Express response object, used to send back the ping results.
 */
router.get('/', (req, res) => {
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

export default router;
