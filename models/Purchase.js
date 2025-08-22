const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        category: String,
        batchInfo: {
          batchNumber: { type: String, required: true },
          quantity: { type: Number, required: true },
          totalCost: { type: Number, required: true },
          unitPurchasePrice: { type: Number, required: true },
          packPurchasePrice: { type: Number, required: true },
          expiryDate: { type: Date },
        },
      },
    ],
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

module.exports = mongoose.model("Purchase", purchaseSchema);
