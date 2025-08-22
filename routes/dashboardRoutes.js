const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

// Route to fetch dashboard data
router.get("/", authMiddleware, dashboardController.getDashboardStats);

module.exports = router;
