const express = require("express");
const {
  addNewProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  // bulkImportProducts,
} = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, addNewProduct);
router.get("/", authMiddleware, getAllProducts);
router.get("/:id", authMiddleware, getProductById);
router.put("/:id", authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);
// router.post("/bulk-import", bulkImportProducts);

module.exports = router;
