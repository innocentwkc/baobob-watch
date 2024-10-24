const express = require("express");
const router = express.Router();
const { validatePingRequest } = require("../validators/pingValidator");
const logger = require("../utils/logger");

function setupPingRoutes(pingService, wss) {
  router.post("/start", async (req, res) => {
    try {
      const { error, value } = validatePingRequest(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      res.json({ message: "Monitoring started", params: value });

      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          pingService.monitorHost(value, client);
        }
      });
    } catch (error) {
      logger.error("Error starting ping monitoring:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/history", async (req, res) => {
    try {
      const results = await pingService.getHistory();
      res.json(results);
    } catch (error) {
      logger.error("Error fetching ping history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

module.exports = setupPingRoutes;
