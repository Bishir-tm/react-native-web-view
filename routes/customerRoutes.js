const express = require("express");
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Route to fetch all customers
router.get("/", authMiddleware, getAllCustomers);

// Route to fetch a single customer by ID
router.get("/:id", authMiddleware, getCustomerById);

// Route to create a new customer
router.post("/", authMiddleware, createCustomer);

// Route to update customer details
router.put("/:id", authMiddleware, updateCustomer);

// Route to delete a customer
router.delete("/:id", authMiddleware, deleteCustomer);

module.exports = router;
