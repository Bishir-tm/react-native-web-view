const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    standardPackPrice: {
      type: Number,
      default: 0,
    },
    standardUnitPrice: {
      type: Number,
      default: 0,
    },
    barcodeOrSku: {
      type: String,
      default: null,
    },

    unitsInPack: {
      type: Number,
      default: 1, // Default to 1 for loose items
    },
    batches: [
      {
        batchNumber: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        packPurchasePrice: {
          type: Number,
          required: true,
        },
        expiryDate: {
          type: Date,
          required: true,
        },
      },
    ],
    description: {
      type: String,
    },
    lastAction: {
      action: {
        type: String,
        enum: ["create", "update", "edit", "delete"],
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

productSchema.index(
  { barcodeOrSku: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { barcodeOrSku: { $type: "string" } },
  }
);

module.exports = mongoose.model("Product", productSchema);
