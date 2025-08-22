const express = require("express");
const {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} = require("../controllers/purchaseController");

const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, createPurchase);
router.get("/", authMiddleware, getAllPurchases);
router.get("/:id", authMiddleware, getPurchaseById);
router.put("/:id", authMiddleware, updatePurchase);
router.delete("/:id", authMiddleware, deletePurchase);

module.exports = router;
