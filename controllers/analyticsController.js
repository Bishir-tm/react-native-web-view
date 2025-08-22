const Product = require("../models/Product");
const Order = require("../models/Order");
const Category = require("../models/Category");
const Expense = require("../models/Expense");
const { startOfDay, endOfDay } = require("date-fns");

const getAnalytics = async (req, res) => {
  try {
    const { timeframe = "month", startDate, endDate } = req.query;

    const start = startDate ? startOfDay(new Date(startDate)) : null;
    const end = endDate ? endOfDay(new Date(endDate)) : null;

    const dateMatch =
      start && end
        ? {
            createdAt: { $gte: start, $lte: end },
          }
        : {};

    // Sales and Revenue Analysis
    const salesData = await Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Expense Analysis
    const expenseData = await Expense.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
            category: "$category",
          },
          totalExpense: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
          },
          expenses: {
            $push: {
              category: "$_id.category",
              amount: "$totalExpense",
            },
          },
          totalExpenses: { $sum: "$totalExpense" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Expiring Products Analysis
    const daysToExpire = parseInt(req.query.days) || 90;
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysToExpire);

    const expiringProducts = await Product.aggregate([
      {
        $project: {
          name: 1,
          category: 1,
          unitsInPack: 1,
          description: 1,
          expiringBatches: {
            $filter: {
              input: "$batches",
              as: "batch",
              cond: {
                $and: [
                  // Only include batches with remaining quantity
                  { $gt: ["$$batch.quantity", 0] },
                  // Check expiry conditions
                  { $lt: ["$$batch.expiryDate", expiryThreshold] },
                  { $gte: ["$$batch.expiryDate", new Date()] },
                  ...(start && end
                    ? [
                        { $gte: ["$$batch.expiryDate", start] },
                        { $lte: ["$$batch.expiryDate", end] },
                      ]
                    : []),
                ],
              },
            },
          },
        },
      },
      // Only include products that have batches matching our criteria
      { $match: { "expiringBatches.0": { $exists: true } } },
      {
        $addFields: {
          totalExpiringQuantity: {
            $reduce: {
              input: "$expiringBatches",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.quantity"] },
            },
          },
        },
      },
    ]);

    // Profitability Analysis
    const profitabilityMetrics = await Order.aggregate([
      { $match: dateMatch },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          cost: {
            $sum: {
              $multiply: [
                "$items.packQuantity",
                { $arrayElemAt: ["$product.batches.packPurchasePrice", 0] },
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "expenses",
          let: { year: "$_id.year", month: "$_id.month", day: "$_id.day" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $year: "$date" }, "$$year"] },
                    { $eq: [{ $month: "$date" }, "$$month"] },
                    { $eq: [{ $dayOfMonth: "$date" }, "$$day"] },
                  ],
                },
              },
            },
            {
              $group: { _id: null, totalExpenses: { $sum: "$amount" } },
            },
          ],
          as: "expenseData",
        },
      },
      {
        $addFields: {
          expenses: {
            $ifNull: [{ $arrayElemAt: ["$expenseData.totalExpenses", 0] }, 0],
          },
          grossProfit: { $subtract: ["$revenue", "$cost"] },
          netProfit: {
            $subtract: [
              { $subtract: ["$revenue", "$cost"] },
              {
                $ifNull: [
                  { $arrayElemAt: ["$expenseData.totalExpenses", 0] },
                  0,
                ],
              },
            ],
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json({
      success: true,
      data: { salesData, expenseData, expiringProducts, profitabilityMetrics },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
      error: error.message,
    });
  }
};

module.exports = { getAnalytics };
