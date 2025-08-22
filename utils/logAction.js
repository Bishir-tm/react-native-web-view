const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

const logAction = async (
  userId,
  entityType,
  entityId,
  action,
  oldValue,
  newValue,
  reason
) => {
  try {
    // Create and save audit log entry
    const auditLog = new AuditLog({
      userId,
      entityType,
      entityId,
      action,
      oldValue,
      newValue,
      reason,
    });
    await auditLog.save();

    // Get the model dynamically based on entityType
    const Model = mongoose.model(entityType);

    // Update the lastAction field of the corresponding document
    await Model.findByIdAndUpdate(entityId, {
      lastAction: {
        action: action,
        performedBy: userId,
        createdAt: new Date(),
        reason: reason,
      },
    });
  } catch (error) {
    throw error;
  }
};

module.exports = logAction;
