const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  refundAmount: { type: Number, required: true },
  refundReason: { type: String, required: true },
  refundStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  refundedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null }, // If null, order is active
});

const Refund = mongoose.model("Refund", refundSchema);

module.exports = Refund;
