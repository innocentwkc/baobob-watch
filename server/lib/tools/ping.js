// ping.js
import net from 'net';
import { performance } from 'perf_hooks';
import EventEmitter from 'events';

/**
 * Function to perform a TCP "ping" to a given host and port, with a specified timeout, for a number of cycles.
 * @param {string} host - The host or IP address to ping.
 * @param {number} port - The TCP port to connect to.
 * @param {number} timeout - The timeout in milliseconds.
 * @param {number} cycles - The number of ping cycles. If set to -1, it will ping indefinitely.
 */
export function tcpPing(host, ports = [80], timeout = 5000, cycles = 4) {
	const emitter = new EventEmitter();

	ports.forEach(port => {
		let cycleCount = 0;

		const pingCycle = () => {
			if (cycles !== -1 && cycleCount >= cycles) {
				emitter.emit('complete', `Completed ${cycles} ping cycles to ${host}:${port}`);
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
