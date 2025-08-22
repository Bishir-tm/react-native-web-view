const logAction = require("../utils/logAction"); // Import log function
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");

exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("supplier")
      .populate("products.product")
      .populate("createdBy", "fullname role")
      .sort({ updatedAt: -1 });

    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPurchase = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const purchaseData = req.body;

    for (const item of purchaseData.products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }

      // Calculate total units based on pack quantity
      const totalUnits = item.batchInfo.quantity * product.unitsInPack;

      // Update standard prices if provided
      await Product.findByIdAndUpdate(item.product, {
        standardPackPrice: item.standardPackPrice ?? product.standardPackPrice,
        standardUnitPrice: item.standardUnitPrice ?? product.standardUnitPrice,
        $push: {
          batches: {
            batchNumber: item.batchInfo.batchNumber || Date.now(),
            quantity: totalUnits, // Store the total units in stock
            packPurchasePrice: item.batchInfo.packPurchasePrice,
            expiryDate: item.batchInfo.expiryDate,
          },
        },
      });
    }

    // Create purchase record with pack quantities
    const purchase = await Purchase.create({
      purchaseDate: purchaseData.purchaseDate,
      supplier: purchaseData.supplier,
      products: purchaseData.products.map((item) => ({
        product: item.product,
        category: item.category,
        batchInfo: {
          batchNumber: item.batchInfo.batchNumber || Date.now(),
          quantity: item.batchInfo.quantity, // Store pack quantity in purchase record
          totalCost: item.batchInfo.totalCost,
          packPurchasePrice: item.batchInfo.packPurchasePrice,
          unitPurchasePrice: item.batchInfo.unitPurchasePrice,
          expiryDate: item.batchInfo.expiryDate,
        },
      })),
      createdBy: req.user.id,
    });

    await logAction(
      req.user.id,
      "Purchase",
      purchase._id,
      "create",
      null,
      purchase,
      `Created new Purchase`
    );

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePurchase = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { id } = req.params;
    const updateData = req.body;

    const oldPurchase = await Purchase.findById(id);
    if (!oldPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Revert old batches
    for (const item of oldPurchase.products) {
      await Product.findByIdAndUpdate(item.product, {
        $pull: { batches: { batchNumber: item.batchInfo.batchNumber } },
      });
    }

    // Add new batches with corrected quantities
    for (const item of updateData.products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }

      // Calculate total units based on pack quantity
      const totalUnits = item.batchInfo.quantity * product.unitsInPack;

      await Product.findByIdAndUpdate(item.product, {
        standardPackPrice: item.standardPackPrice ?? undefined,
        standardUnitPrice: item.standardUnitPrice ?? undefined,
        $push: {
          batches: {
            batchNumber: item.batchInfo.batchNumber || Date.now(),
            quantity: totalUnits, // Store the total units in stock
            packPurchasePrice: item.batchInfo.packPurchasePrice,
            expiryDate: item.batchInfo.expiryDate,
          },
        },
      });
    }

    const purchase = await Purchase.findByIdAndUpdate(
      id,
      {
        purchaseDate: updateData.purchaseDate,
        supplier: updateData.supplier,
        products: updateData.products.map((item) => ({
          product: item.product,
          category: item.category,
          batchInfo: {
            batchNumber: item.batchInfo.batchNumber || Date.now(),
            quantity: item.batchInfo.quantity, // Store pack quantity in purchase record
            totalCost: item.batchInfo.totalCost,
            packPurchasePrice: item.batchInfo.packPurchasePrice,
            unitPurchasePrice: item.batchInfo.unitPurchasePrice,
            expiryDate: item.batchInfo.expiryDate,
          },
        })),
        lastAction: {
          action: "update",
          performedBy: req.user._id,
          createdAt: new Date(),
          reason: updateData.reason || "Purchase update",
        },
      },
      { new: true }
    );

    await logAction(
      req.user.id,
      "Purchase",
      id,
      "update",
      oldPurchase,
      purchase,
      `Updated Purchase`
    );

    return res.json({ message: "Purchase updated successfully", purchase });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("supplier")
      .populate("products.product")
      .populate("createdBy", "name email");

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePurchase = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Remove batches from products
    for (const item of purchase.products) {
      await Product.findByIdAndUpdate(item.product, {
        $pull: { batches: { batchNumber: item.batchInfo.batchNumber } },
      });
    }

    // Delete purchase record
    await Purchase.findByIdAndDelete(id);

    // Log the action
    await logAction(
      req.user.id,
      "Purchase",
      id,
      "delete",
      purchase,
      null,
      "Deleted Purchase"
    );

    res.json({ message: "Purchase deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
