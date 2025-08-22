const Product = require("../models/Product");
const Order = require("../models/Order");
const Category = require("../models/Category");

const getDashboardStats = async (req, res) => {
  try {
    // Get current date and date 6 months ago for trends
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Calculate total inventory value and products near expiry
    const products = await Product.find();
    let itemsNearExpiry = 0;

    // Calculate expiry threshold (date to report products near expiry)
    const expiryThreshold = new Date();
    const daysToExpire = parseInt(req.query.days) || 30;
    expiryThreshold.setDate(expiryThreshold.getDate() + daysToExpire);

    // Get active orders
    const activeOrders = await Order.countDocuments({
      paymentStatus: "pending",
    });

    // Get today's sales data
    const todaysSales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.productId",
          totalPackQuantity: { $sum: "$items.packQuantity" },
          totalUnitQuantity: { $sum: "$items.unitQuantity" },
          totalAmount: { $sum: "$items.subtotal" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $project: {
          productName: "$product.name",
          totalPackQuantity: 1,
          totalUnitQuantity: 1,
          totalAmount: 1,
        },
      },
    ]);

    // Calculate monthly sales data
    const monthlyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get products with low stock
    const lowStockThreshold = 30;
    const lowStockProducts = await Product.aggregate([
      {
        $unwind: "$batches",
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          totalStock: { $sum: "$batches.quantity" },
        },
      },
      {
        $match: {
          totalStock: { $lt: lowStockThreshold },
        },
      },
    ]);

    // Get expiring products with batch details - FIXED VERSION
    // const expiringProducts = await Product.find({
    //   "batches.expiryDate": {
    //     $lte: expiryThreshold,
    //     $gte: today,
    //   },
    // }).then((products) => {
    //   return products
    //     .map((product) => {
    //       // Filter only the batches that are expiring
    //       const expiringBatches = product.batches.filter(
    //         (batch) =>
    //           batch.expiryDate <= expiryThreshold && batch.expiryDate >= today
    //       );

    //       return {
    //         _id: product._id,
    //         name: product.name,
    //         category: product.category,
    //         expiringBatches: expiringBatches.map((batch) => ({
    //           batchNumber: batch.batchNumber,
    //           quantity: batch.quantity,
    //           expiryDate: batch.expiryDate,
    //           packSellingPrice: batch.packSellingPrice,
    //           unitSellingPrice: batch.unitSellingPrice,
    //         })),
    //       };
    //     })
    //     .filter((product) => product.expiringBatches.length > 0);
    // });

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
                  { $gte: ["$$batch.expiryDate", today] },
                ],
              },
            },
          },
        },
      },
      // Remove products with no expiring batches
      { $match: { "expiringBatches.0": { $exists: true } } },
      // Add calculated fields
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

    // Get recent activity
    const recentActivity = await Order.find()
      .sort({ updatedAt: -1 })
      .limit(4)
      .populate("items.productId");

    // Get category stats
    const categoryCount = await Category.countDocuments();
    const productCount = await Product.countDocuments();

    return res.json({
      success: true,
      data: {
        activeOrders,
        itemsNearExpiry,
        todaysSales,
        monthlyOrders,
        lowStockProducts,
        expiringProducts,
        recentActivity,
        categoryCount,
        productCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
