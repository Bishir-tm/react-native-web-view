const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true }, // Email is optional but must be unique if provided
    address: { type: String },
    debtLimit: {
      type: Number,
      default: 0,
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
      }, // User who performed the action
      createdAt: { type: Date, default: null }, // Timestamp of last action
      reason: { type: String, default: null }, // Reason for the action
      deletedAt: { type: Date, default: null }, // If null, order is active
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
