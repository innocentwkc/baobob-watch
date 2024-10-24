const ping = require("ping");
const logger = require("../utils/logger");

class PingService {
  constructor(db) {
    this.db = db;
  }

  async monitorHost(params, ws) {
    const { ip, timeout, packetSize, duration } = params;
    const startTime = Date.now();

    const interval = setInterval(async () => {
      try {
        const result = await this.pingHost(ip, timeout, packetSize);
        await this.saveResult(result);
        this.sendUpdate(ws, result);

        if (Date.now() - startTime >= duration) {
          this.endMonitoring(ws, interval);
        }
      } catch (error) {
        logger.error("Ping monitoring error:", error);
      }
    }, 1000);
  }

  async pingHost(ip, timeout, packetSize) {
    const result = await ping.promise.probe(ip, {
      timeout: timeout / 1000,
      extra: [`-s ${packetSize}`],
    });

    return {
      timestamp: new Date(),
      ip,
      responseTime: result.time,
      packetSize,
      timeout,
      success: result.alive,
    };
  }

  async saveResult(result) {
    await this.db.run(
      `
            INSERT INTO ping_results (
                ip, response_time, packet_size, timeout, success
            ) VALUES (?, ?, ?, ?, ?)
        `,
      [
        result.ip,
        result.responseTime,
        result.packetSize,
        result.timeout,
        result.success ? 1 : 0,
      ]
    );
  }

  sendUpdate(ws, result) {
    ws.send(
      JSON.stringify({
        timestamp: result.timestamp,
        responseTime: result.responseTime,
        success: result.success,
      })
    );
  }

  endMonitoring(ws, interval) {
    clearInterval(interval);
    ws.send(JSON.stringify({ finished: true }));
  }

  async getHistory() {
    return await this.db.all(`
            SELECT 
                timestamp,
                ip,
                response_time as responseTime,
                packet_size as packetSize,
                timeout,
                success
            FROM ping_results 
            ORDER BY timestamp DESC 
            LIMIT 1000
        `);
  }
}

module.exports = PingService;
