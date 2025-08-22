const express = require("express");
const path = require("path");

function createServer() {
  const expressApp = express();
  const port = 3000;

  // Serve static files from the same directory
  expressApp.use(express.static(path.join(__dirname)));

  // Start server and return both app and server instances
  const server = expressApp.listen(port, () => {
    console.log(`Express server running at http://localhost:${port}`);
  });

  return { expressApp, server, port };
}

module.exports = createServer;
