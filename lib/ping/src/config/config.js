

const path = require("path");

module.exports = {
  port: process.env.PORT || 7000,
  dbPath: path.join(__dirname, "../data/ping_monitor.db"),
  logConfig: {
    level: "info",
    format: {
      timestamp: true,
      json: true,
    },
    files: {
      error: "logs/error.log",
      combined: "logs/combined.log",
    },
  },
  ping: {
    minTimeout: 100,
    maxTimeout: 5000,
    minPacketSize: 32,
    maxPacketSize: 65507,
    minDuration: 1000,
    maxDuration: 3600000,
  },
};