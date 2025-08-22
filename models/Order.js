const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    customerDetails: {
      name: { type: String, default: "Walk-in" },
      phone: { type: String, required: false },
      email: { type: String, required: false },
      address: { type: String, required: false },
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        batchNumber: { type: String, required: true },
        packQuantity: { type: Number, default: 0 },
        unitQuantity: { type: Number, default: 0 },
        packPrice: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        subtotal: { type: Number, required: true },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    balance: { type: Number, default: 0 }, // For partial payments
    change: { type: Number, default: 0 }, // For overpayments
    paymentMethod: {
      type: String,
      enum: ["cash", "transfer", "card"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "unpaid"],
      default: "pending",
    },
    lastAction: {
      action: {
        type: String,
        enum: ["create", "update", "delete"],
        default: null,
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      createdAt: { type: Date, default: null },
      reason: { type: String, default: null },
    },
    deletedAt: { type: Date, default: null }, // If null, order is active
  },

  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
