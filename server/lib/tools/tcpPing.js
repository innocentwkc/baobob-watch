// tcp-ping.js
import net from 'net';
import { performance } from 'perf_hooks';
import EventEmitter from 'events';

/**
 * Performs a TCP "ping" to a specified host and an array of ports. Each ping attempt is timed with a specified timeout and can be repeated for a given number of cycles.
 *
 * @param {string} host - The host or IP address to be pinged.
 * @param {number[]} [ports=[80]] - An array of TCP ports to connect to. Defaults to port 80 if not specified.
 * @param {number} [timeout=5000] - The timeout for each ping attempt in milliseconds. Defaults to 5000ms.
 * @param {number} [cycles=4] - The number of ping cycles to perform for each port. Set to -1 for indefinite pinging. Defaults to 4 cycles.
 * @returns {EventEmitter} - An EventEmitter instance that emits 'data' events for each ping result and a 'complete' event when all pings are done.
 */
function tcpPing(host, ports = [80], timeout = 5000, cycles = 4) {
	const emitter = new EventEmitter();
	let completedPorts = new Set();

	ports.forEach(port => {
		let cycleCount = 0;

		const pingCycle = () => {
			// Check if the set number of cycles is completed
			if (cycles !== -1 && cycleCount >= cycles) {
				completedPorts.add(port);
				// Emit a 'complete' event when all ports are done
				if (completedPorts.size === ports.length) {
					emitter.emit('complete', `Completed ${cycles} ping cycles to ${host} on all ports`);
				}
				return;
			}

			cycleCount++;
			const startTime = performance.now();
			const socket = new net.Socket();
			socket.setTimeout(timeout);

			socket.on('connect', () => {
				const endTime = performance.now();
				emitter.emit('data', `TCP Ping #${cycleCount} to ${host}:${port} successful. Time: ${Math.round(endTime - startTime)}ms`);
				socket.destroy();
				setTimeout(pingCycle, 1000);
			});

			socket.on('timeout', () => {
				emitter.emit('data', `TCP Ping #${cycleCount} to ${host}:${port} timed out.`);
				socket.destroy();
				setTimeout(pingCycle, 1000);
			});

			socket.on('error', (error) => {
				emitter.emit('data', `TCP Ping #${cycleCount} to ${host}:${port} failed: ${error.message}`);
				socket.destroy();
				setTimeout(pingCycle, 1000);
			});

			socket.connect(port, host);
		};

		pingCycle();
	});

	return emitter;
}

export default tcpPing;
