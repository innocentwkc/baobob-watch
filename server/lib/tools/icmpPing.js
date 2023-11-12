// icmpPing.js
import raw from 'raw-socket';
import { performance } from 'perf_hooks';
import EventEmitter from 'events';

/**
 * Performs an ICMP (Internet Control Message Protocol) ping to a specified host.
 * 
 * @param {string} host - The IP address or hostname to be pinged.
 * @param {number} [timeout=5000] - The interval between each ping in milliseconds. Defaults to 5000ms.
 * @param {number} [count=-1] - The number of pings to send. Set to -1 for indefinite pinging. Defaults to -1.
 * @returns {EventEmitter} - An EventEmitter instance that emits 'data' events for each ping result and a 'complete' event when the ping process is done.
 */
function icmpPing(host, timeout = 5000, count = -1) {
  // Create a raw socket for ICMP protocol
  const socket = raw.createSocket({ protocol: raw.Protocol.ICMP });
  const emitter = new EventEmitter();
  let sentCount = 0; // Counter for sent pings
  let isPinging = true; // Flag to control the ping process
  let startTimes = new Map(); // Map to store start times of pings

  // Handle incoming ICMP messages
  socket.on('message', (buffer, source) => {
    if (source === host && isPinging) {
      const endTime = performance.now();
      const startTime = startTimes.get(sentCount);
      const time = endTime - startTime; // Calculate round trip time
      // Emit data event for each received ping response
      emitter.emit('data', `Ping to ${host}: Sequence ${sentCount + 1}, Time: ${time.toFixed(2)}ms`);
      sentCount++;
      
      // Check if the desired number of pings have been sent
      if (count !== -1 && sentCount >= count) {
        isPinging = false; // Stop pinging
        socket.close(); // Close the socket
        emitter.emit('complete', 'Ping process completed.'); // Emit complete event
        startTimes.clear(); // Clear the start times map
      }
    }
  });

  // Function to send a ping
  const ping = () => {
    if (!isPinging) return; // Stop pinging if flag is false

    // Create an ICMP echo request packet
    const buffer = Buffer.from([0x08, 0x00, 0x7d, 0x3b, 0x00, 0x00, 0x00, 0x00]);
    startTimes.set(sentCount, performance.now()); // Store start time
    // Send the ICMP packet
    socket.send(buffer, 0, buffer.length, host, (err) => {
      if (err) {
        emitter.emit('error', err); // Emit error event in case of an error
      }
    });

    // Schedule next ping based on timeout
    if (count === -1 || sentCount < count - 1) {
      setTimeout(ping, timeout);
    }
  };

  ping(); // Start the ping process

  return emitter; // Return the EventEmitter for event handling
}

export default icmpPing;
