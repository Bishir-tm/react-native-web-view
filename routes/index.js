const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const supplierRoutes = require("./supplierRoutes");
const orderRoutes = require("./orderRoutes");
const expenseRoutes = require("./expenseRoutes");
const customerRoutes = require("./customerRoutes");
const categoryRoutes = require("./categoryRoutes");
const purchaseRoutes = require("./purchaseRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const debtorRoutes = require("./debtorRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/customers", customerRoutes);
router.use("/categories", categoryRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/products", productRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/purchase", purchaseRoutes);
router.use("/orders", orderRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/expenses", expenseRoutes);
router.use("/debtors", debtorRoutes);

module.exports = router;
