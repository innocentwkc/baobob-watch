const { execSync } = require("child_process");

const tool = process.argv[2] || "all";

if (tool === "all") {
  execSync('concurrently "npm run dev:ping" "npm run dev:traceroute"', {
    stdio: "inherit",
  });
} else {
  execSync(`npm run dev:${tool}`, { stdio: "inherit" });
}
