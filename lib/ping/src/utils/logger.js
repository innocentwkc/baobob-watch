const winston = require("winston");
const config = require("../config/config");

const logger = winston.createLogger({
  level: config.logConfig.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: config.logConfig.files.error,
      level: "error",
    }),
    new winston.transports.File({
      filename: config.logConfig.files.combined,
    }),
  ],
});

module.exports = logger;
