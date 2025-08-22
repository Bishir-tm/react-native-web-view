const express = require("express");
const {
  getAllDebtors,
  processDebtPayment,
} = require("../controllers/debtorsController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getAllDebtors);
router.post("/:orderId", authMiddleware, processDebtPayment);

module.exports = router;
