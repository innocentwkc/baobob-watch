const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const path = require("path");
const config = require("./config/config");
const Database = require("./db/database");
const PingService = require("./services/pingService");
const setupPingRoutes = require("./routes/pingRoutes");
const setupWebSocket = require("./websocket/wsHandler");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

async function createApp() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // Initialize database
  const db = await Database.init();
  const pingService = new PingService(db);

  // Middleware
  app.use(express.json());
  app.use(express.static("public"));

  // Routes
  app.use("/api/ping", setupPingRoutes(pingService, wss));

  // WebSocket setup
  setupWebSocket(wss);

  // Error handling
  app.use(errorHandler);

  return { app, server };
}

// Start server
async function startServer() {
  try {
    const { app, server } = await createApp();

    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error("Server startup error:", error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = createApp;
