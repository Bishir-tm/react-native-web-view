const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Inventory Purchase",
        "Utilities",
        "Rent",
        "Transportation",
        "Maintenance",
        "Salaries",
        "Miscellaneous",
        "Other",
      ],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit", "Bank Transfer", "Card", "Other"],
      required: true,
    },
    invoice: {
      type: String, // Invoice number or ID
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

module.exports = mongoose.model("Expense", ExpenseSchema);
