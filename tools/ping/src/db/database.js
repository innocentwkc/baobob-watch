const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const config = require("../config/config");
const logger = require("../utils/logger");

class Database {
  static async init() {
    console.log("Database initialization started...");
    try {
      const dbPath = config.dbPath;
      console.log("Database path:", dbPath);

      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      // Enable foreign keys and verbose logging in development
      await db.run("PRAGMA foreign_keys = ON");
      if (process.env.NODE_ENV !== "production") {
        sqlite3.verbose();
      }

      // Create tables
      await db.exec(`
        CREATE TABLE IF NOT EXISTS ping_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip TEXT NOT NULL,
          response_time REAL,
          packet_size INTEGER,
          timeout INTEGER,
          success INTEGER
        )
      `);

      // Verify database connection
      const testQuery = await db.get("SELECT 1 as test");
      if (testQuery.test !== 1) {
        throw new Error("Database verification failed");
      }

      console.log("Database initialized successfully");
      logger.info("Database initialized successfully");
      return db;
    } catch (error) {
      console.error("Database initialization error:", error);
      logger.error("Database initialization error:", error);
      throw error;
    }
  }
}

module.exports = Database;
