const express = require("express");
const {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createSupplier);
router.get("/", authMiddleware, getAllSuppliers);
router.get("/:id", authMiddleware, getSupplierById);
router.put("/:id", authMiddleware, updateSupplier);
router.delete("/:id", authMiddleware, deleteSupplier);

module.exports = router;
