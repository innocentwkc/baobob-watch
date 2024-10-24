const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const config = require("../config/config");
const logger = require("../utils/logger");

class Database {
  static async init() {
    try {
      const db = await open({
        filename: config.dbPath,
        driver: sqlite3.Database,
      });

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

      logger.info("Database initialized successfully");
      return db;
    } catch (error) {
      logger.error("Database initialization error:", error);
      throw error;
    }
  }
}

module.exports = Database;
