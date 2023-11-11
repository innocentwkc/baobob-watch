// index.js
import express from 'express';
import { tcpPing } from './lib/tools/ping.js';

const app = express();
app.use(express.json());

app.get('/ping', (req, res) => {
  const { host, ports = '80', timeout, cycles } = req.query;
  const parsedPorts = ports.split(',').map(port => parseInt(port.trim()));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const emitter = tcpPing(host, parsedPorts, parseInt(timeout), parseInt(cycles));
  emitter.on('data', (data) => {
    res.write(`data: ${data}\n\n`);
  });

  // You might need more sophisticated logic to handle the completion of all ports
  emitter.on('complete', (message) => {
    res.write(`data: ${message}\n\n`);
  });
});

const port = 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
