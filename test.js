// backend/src/app.js
const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const ping = require("ping");
const joi = require("joi");
const winston = require("winston");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

// Configure logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Database setup
let db;
async function setupDatabase() {
  try {
    db = await open({
      filename: path.join(__dirname, "ping_monitor.db"),
      driver: sqlite3.Database,
    });

    // Create tables if they don't exist
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

    logger.info("Database setup completed");
  } catch (error) {
    logger.error("Database setup error:", error);
    throw error;
  }
}

// Validation Schema
const pingRequestSchema = joi.object({
  ip: joi.string().ip().required(),
  timeout: joi.number().min(100).max(5000).default(1000),
  packetSize: joi.number().min(32).max(65507).default(32),
  duration: joi.number().min(1000).max(3600000).default(60000),
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static("public"));

// Middleware for error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Something broke!");
});

// WebSocket connection handler
wss.on("connection", (ws) => {
  logger.info("New WebSocket connection established");

  ws.on("error", (error) => {
    logger.error("WebSocket error:", error);
  });
});

// Start ping monitoring
async function startPingMonitoring(params, ws) {
  const { ip, timeout, packetSize, duration } = params;
  const startTime = Date.now();

  const interval = setInterval(async () => {
    try {
      const result = await ping.promise.probe(ip, {
        timeout: timeout / 1000,
        extra: [`-s ${packetSize}`],
      });

      // Save result to SQLite
      await db.run(
        `
                INSERT INTO ping_results (ip, response_time, packet_size, timeout, success)
                VALUES (?, ?, ?, ?, ?)
            `,
        [ip, result.time, packetSize, timeout, result.alive ? 1 : 0]
      );

      // Send real-time data through WebSocket
      ws.send(
        JSON.stringify({
          timestamp: new Date(),
          responseTime: result.time,
          success: result.alive,
        })
      );
    } catch (error) {
      logger.error("Ping error:", error);
    }

    if (Date.now() - startTime >= duration) {
      clearInterval(interval);
      ws.send(JSON.stringify({ finished: true }));
    }
  }, 1000);
}

// API Routes
app.post("/api/ping/start", async (req, res) => {
  try {
    const { error, value } = pingRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Store the monitoring parameters and send initial response
    res.json({ message: "Monitoring started", params: value });

    // Find the associated WebSocket connection and start monitoring
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        startPingMonitoring(value, client);
      }
    });
  } catch (error) {
    logger.error("Error starting ping monitoring:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get historical data
app.get("/api/ping/history", async (req, res) => {
  try {
    const results = await db.all(`
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
    res.json(results);
  } catch (error) {
    logger.error("Error fetching ping history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Frontend code (public/index.html)
const frontendCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ping Monitor</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .line {
            fill: none;
            stroke: steelblue;
            stroke-width: 2;
        }
        .grid line {
            stroke: lightgrey;
            stroke-opacity: 0.7;
            shape-rendering: crispEdges;
        }
        .grid path {
            stroke-width: 0;
        }
        form {
            margin-bottom: 20px;
        }
        input, button {
            margin: 5px;
            padding: 8px;
        }
        button {
            background-color: steelblue;
            color: white;
            border: none;
            cursor: pointer;
            padding: 10px 20px;
        }
        button:hover {
            background-color: darkslateblue;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Ping Monitor</h1>
        <form id="pingForm">
            <input type="text" id="ip" placeholder="IP Address" required>
            <input type="number" id="timeout" placeholder="Timeout (ms)" value="1000">
            <input type="number" id="packetSize" placeholder="Packet Size" value="32">
            <input type="number" id="duration" placeholder="Duration (ms)" value="60000">
            <button type="submit">Start Monitoring</button>
        </form>
        <div id="chart"></div>
    </div>

    <script>
        // D3.js chart setup
        const margin = {top: 20, right: 20, bottom: 30, left: 50};
        const width = 960 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Scales
        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

        // Line generator
        const line = d3.line()
            .x(d => x(d.timestamp))
            .y(d => y(d.responseTime))
            .defined(d => !isNaN(d.responseTime));

        // Add grid
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickSize(-height).tickFormat(""));

        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

        // Add axes
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + height + ")");

        svg.append("g")
            .attr("class", "y-axis");

        // Add labels
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Response Time (ms)");

        // WebSocket connection
        const ws = new WebSocket('ws://' + window.location.host);
        const data = [];

        ws.onmessage = (event) => {
            const pingData = JSON.parse(event.data);
            
            if (pingData.finished) {
                console.log('Monitoring finished');
                return;
            }

            pingData.timestamp = new Date(pingData.timestamp);
            data.push(pingData);

            // Keep only last 100 points for smooth visualization
            if (data.length > 100) {
                data.shift();
            }

            // Update chart
            updateChart();
        };

        function updateChart() {
            // Update scales
            x.domain(d3.extent(data, d => d.timestamp));
            y.domain([0, d3.max(data, d => d.responseTime) * 1.1]); // Add 10% padding

            // Update axes
            svg.select(".x-axis").call(d3.axisBottom(x));
            svg.select(".y-axis").call(d3.axisLeft(y));

            // Update line
            svg.selectAll(".line")
                .data([data])
                .join("path")
                .attr("class", "line")
                .attr("d", line);
        }

        // Form submission
        document.getElementById('pingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                ip: document.getElementById('ip').value,
                timeout: parseInt(document.getElementById('timeout').value),
                packetSize: parseInt(document.getElementById('packetSize').value),
                duration: parseInt(document.getElementById('duration').value)
            };

            try {
                const response = await fetch('/api/ping/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                // Clear existing data
                data.length = 0;
                updateChart();

            } catch (error) {
                console.error('Error:', error);
                alert('Error starting monitoring');
            }
        });

        // Load historical data on page load
        async function loadHistoricalData() {
            try {
                const response = await fetch('/api/ping/history');
                const historicalData = await response.json();
                
                // Convert timestamps to Date objects
                historicalData.forEach(d => d.timestamp = new Date(d.timestamp));
                
                // Update chart with historical data
                data.push(...historicalData);
                updateChart();
            } catch (error) {
                console.error('Error loading historical data:', error);
            }
        }

        loadHistoricalData();
    </script>
</body>
</html>
`;

// Initialize database and start server
async function startServer() {
  try {
    await setupDatabase();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Server startup error:", error);
    process.exit(1);
  }
}

startServer();

// Export for testing
module.exports = { app, server, db };
