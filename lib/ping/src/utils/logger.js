const winston = require("winston");
const path = require("path");
const config = require("../config/config");

// Ensure logs directory exists
const fs = require("fs");
const logsDir = path.dirname(config.logConfig.files.error);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.logConfig.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: config.logConfig.files.error,
      level: "error",
    }),
    new winston.transports.File({
      filename: config.logConfig.files.combined,
    }),
  ],
});

// Test logger
try {
  logger.info("Logger initialized");
} catch (error) {
  console.error("Logger initialization failed:", error);
  process.exit(1);
}

module.exports = logger;
