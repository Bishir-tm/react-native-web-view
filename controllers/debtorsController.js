const mongoose = require("mongoose");
const Order = require("../models/Order");
const Customer = require("../models/Customer");

exports.getAllDebtors = async (req, res) => {
  try {
    // Find orders where balance is greater than 0 AND payment status is "partial" or "unpaid"
    const debtors = await Order.find({
      balance: { $gt: 0 },
      paymentStatus: { $in: ["partial", "unpaid", "pending"] }, // Matches either "partial" or "unpaid"
      deletedAt: null,
    }).populate(); // Populate customer details if needed

    res.status(200).json(debtors);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.processDebtPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amountPaid, paymentMethod, previousBalance } =
      req.body.paymentDetails;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus === "paid") {
      throw new Error("This order is already fully paid");
    }

    if (amountPaid <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    if (amountPaid > order.balance) {
      throw new Error("Payment amount cannot exceed the remaining balance");
    }

    // Update order payment details
    const newAmountPaid = order.amountPaid + amountPaid;
    const newBalance = order.balance - amountPaid;

    order.amountPaid = newAmountPaid;
    order.balance = newBalance;
    order.paymentStatus = newBalance === 0 ? "paid" : "partial";

    // Record the payment action
    order.lastAction = {
      action: "update",
      performedBy: req.user.id,
      createdAt: new Date(),
      reason: `Debt payment of ₦${amountPaid} received via ${paymentMethod}`,
    };

    await order.save();

    res.status(200).json({
      success: true,
      order,
      message: "Payment processed successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
