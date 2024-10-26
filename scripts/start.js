const { execSync } = require("child_process");

const tool = process.argv[2] || "all";

if (tool === "all") {
  // execSync('concurrently "npm run start:ping" "npm run start:traceroute"', {
  //   stdio: "inherit",
  // });
  execSync('concurrently "npm run start:ping"', {
    stdio: "inherit",
  });
} else {
  execSync(`npm run start:${tool}`, { stdio: "inherit" });
}
