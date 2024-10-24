const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Create necessary directories
const dirs = [
  "tools/ping/src",
  "tools/ping/public",
  "tools/ping/logs",
  "tools/ping/data",
  "tools/traceroute/src",
  "tools/traceroute/public",
  "tools/shared/src",
  "examples",
];

dirs.forEach((dir) => {
  fs.mkdirSync(path.join(__dirname, "..", dir), { recursive: true });
  console.log(`Created directory: ${dir}`);
});

// Install dependencies
console.log("Installing dependencies...");
execSync("npm install", { stdio: "inherit" });

// Create symlinks for workspaces
console.log("Setting up workspaces...");
execSync("npm run clean", { stdio: "inherit" });
execSync("npm install", { stdio: "inherit" });

console.log("Bootstrap complete!");




