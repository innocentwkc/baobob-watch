// Import statements using ES6 syntax
import net from 'net';
import { performance } from 'perf_hooks';

/**
 * Function to perform a TCP "ping" to a given host and port, with a specified timeout, for a number of cycles.
 * @param {string} host - The host or IP address to ping.
 * @param {number} port - The TCP port to connect to.
 * @param {number} timeout - The timeout in milliseconds.
 * @param {number} cycles - The number of ping cycles. If set to -1, it will ping indefinitely.
 */
export function tcpPing(host, port = 80, timeout = 5000, cycles = 4) {
    let cycleCount = 0;

    const pingCycle = () => {
        if (cycles !== -1 && cycleCount >= cycles) {
            console.log(`Completed ${cycles} ping cycles to ${host}:${port}`);
            return;
        }

        cycleCount++;
        const startTime = performance.now();
        
        const socket = new net.Socket();

        // Set a timeout for the connection attempt
        socket.setTimeout(timeout);

        socket.on('connect', () => {
            const endTime = performance.now();
            console.log(`TCP Ping #${cycleCount} to ${host}:${port} successful. Time: ${Math.round(endTime - startTime)}ms`);
            socket.destroy();
            setTimeout(pingCycle, 1000); // Wait for 1 second before the next cycle
        });

        socket.on('timeout', () => {
            console.error(`TCP Ping #${cycleCount} to ${host}:${port} timed out.`);
            socket.destroy();
            setTimeout(pingCycle, 1000);
        });

        socket.on('error', (error) => {
            console.error(`TCP Ping #${cycleCount} to ${host}:${port} failed: ${error.message}`);
            socket.destroy();
            setTimeout(pingCycle, 1000);
        });

        socket.connect(port, host);
    };

    pingCycle();
}
