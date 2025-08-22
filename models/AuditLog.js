const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who performed the action
  entityType: { type: String, required: true }, // e.g., "Product", "Expense", "User", "Sale"
  entityId: { type: mongoose.Schema.Types.ObjectId }, // Optional: Affected entity (if applicable)
  action: {
    type: String,
    required: true,
    enum: ["create", "edit", "update", "delete", "adjustStock", "roleChange"],
  },
  oldValue: { type: Object, default: null }, // Stores previous values (for edits)
  newValue: { type: Object, default: null }, // Stores new values (for edits)
  reason: { type: String, default: null }, // Optional: Reason for actions (e.g., "Stock correction")
  timestamp: { type: Date, default: Date.now }, // When the action happened
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
