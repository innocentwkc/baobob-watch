// Import the tcpPing function using ES6 syntax
import { tcpPing } from './lib/tools/ping.js';

// Use the tcpPing function
tcpPing('example.com', 80, 3000, 5); // Ping example.com 5 times
tcpPing('192.168.1.1', 80, 5000, -1); // Ping 192.168.1.1 indefinitely
