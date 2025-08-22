const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectToDB = require("./config/dbConnection");

function createServer() {
  const app = express();

  // Error handling for uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    // Perform graceful shutdown if needed
    process.exit(1);
  });

  // Middleware
  dotenv.config();

  app.use(express.json());
  app.use(cors());

  // Database connection with error handling
  connectToDB();

  // Add error handling middleware
  app.use((err, req, res, next) => {
    console.error("Express error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  // API routes
  app.use("/api", require("./routes/index"));

  // Serve React frontend
  const frontendPath = path.join(__dirname);

  // Add logging for debugging
  console.log("Frontend path:", frontendPath);
  console.log("__dirname:", __dirname);

  // Add detailed logging
  console.log("Current working directory:", process.cwd());
  console.log("Frontend path being used:", frontendPath);
  console.log("Files in frontend path:", fs.readdirSync(frontendPath));

  // Check if frontend files exist
  if (!fs.existsSync(frontendPath)) {
    console.error("Frontend path does not exist:", frontendPath);
  }

  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    console.log("Received request for:", req.url);
    res.sendFile(path.join(frontendPath, "index.html"));
  });

  const port = process.env.PORT || 5000;

  const server = app.listen(port, () => {
    console.log(`Express server running at http://localhost:${port}`);
  });

  return { app, server, port };
}

module.exports = createServer;
