const logger = require("../utils/logger");

function setupWebSocket(wss) {
  wss.on("connection", (ws) => {
    logger.info("New WebSocket connection established");

    ws.on("error", (error) => {
      logger.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      logger.info("WebSocket connection closed");
    });
  });
}

module.exports = setupWebSocket;
