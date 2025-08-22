const Supplier = require("../models/Supplier");
const User = require("../models/User");
const logAction = require("../utils/logAction"); // Import log function

// Create a new supplier
exports.createSupplier = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone || !email || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingSupplier = await Supplier.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingSupplier) {
      return res
        .status(409)
        .json({ message: "A supplier with this email already exists" });
    }

    const newSupplier = new Supplier({ name, phone, email, address });
    await newSupplier.save();
    // Log the action
    await logAction(
      req.user.id,
      "Supplier",
      newSupplier._id,
      "create",
      null,
      newSupplier,
      `Created new supplier`
    );

    res.status(201).json(newSupplier);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while creating the supplier" });
  }
};

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  if (
    req.user.role !== "admin" &&
    req.user.role !== "manager" &&
    req.user.role !== "staff"
  ) {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const suppliers = await Supplier.find()
      .populate("lastAction.performedBy", "fullname")
      .sort({ updatedAt: -1 });
    if (!suppliers.length) {
      return res.status(404).json({ message: "No suppliers found" });
    }
    res.status(200).json(suppliers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching suppliers" });
  }
};

// Get a supplier by ID
exports.getSupplierById = async (req, res) => {
  if (
    req.user.role !== "admin" &&
    req.user.role !== "manager" &&
    req.user.role !== "staff"
  ) {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Supplier ID is required" });
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.status(200).json(supplier);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching the supplier" });
  }
};

// Update a supplier
exports.updateSupplier = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    if (!id || (!name && !phone && !email && !address)) {
      return res.status(400).json({
        message: "Supplier ID and at least one field to update are required",
      });
    }
    const oldSupplier = await Supplier.findById(id);

    const updatedSupplier = await Supplier.findByIdAndUpdate(id, {
      name,
      phone,
      email,
      address,
    });

    if (!updatedSupplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Log the action
    await logAction(
      req.user.id,
      "Supplier",
      id,
      "update",
      oldSupplier,
      updatedSupplier,
      "Updated supplier details"
    );

    res.status(200).json(updatedSupplier);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while updating the supplier" });
  }
};

// Delete a supplier
exports.deleteSupplier = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Supplier ID is required" });
    }

    const deletedSupplier = await Supplier.findByIdAndDelete(id);
    if (!deletedSupplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Log the action
    await logAction(
      req.user.id,
      "Supplier",
      id,
      "delete",
      deletedSupplier,
      null,
      "Deleted supplier"
    );
    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while deleting the supplier" });
  }
};
