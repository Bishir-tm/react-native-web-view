// controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");

/**
 * Create an order.
 *
 * In this version, if a product was auto‐allocated across multiple batches,
 * we “flatten” that product order into multiple order items (one per allocation)
 * so that each order item still has only one batchNumber. This lets us update
 * the corresponding product batches without changing the Order schema.
 */
exports.createOrder = async (req, res) => {
  try {
    let { order } = req.body;
    order.createdBy = req.user.id;
    order.lastAction = {
      action: "create",
      performedBy: req.user.id,
      createdAt: new Date(),
    };

    // Basic validation on amountPaid
    if (order.amountPaid < 0) {
      throw new Error("Amount paid cannot be negative");
    }

    // Determine paymentStatus based on amountPaid
    if (order.amountPaid === order.totalAmount) {
      order.paymentStatus = "paid";
    } else if (order.amountPaid > 0 && order.amountPaid < order.totalAmount) {
      order.paymentStatus = "partial";
    } else if (order.amountPaid === 0) {
      order.paymentStatus = "pending"; // or "unpaid" if that fits your logic
    }

    // --- FLATTEN ITEMS BASED ON ALLOCATIONS ---
    // For each product, if an "allocations" array is provided (meaning auto‑split
    // across multiple batches), create one order item per allocation.
    // Otherwise, keep the original order item.
    let flattenedItems = [];
    order.items.forEach((item) => {
      if (
        item.allocations &&
        Array.isArray(item.allocations) &&
        item.allocations.length > 0
      ) {
        // For each allocation, derive pack and unit quantities from the allocated units.
        // (Here we assume that the original item has a field "unitsInPack" (or default to 1).
        // If your front end did not send it, you might fetch it from the database or default to 1.)
        const unitsInPack = item.unitsInPack || 1;
        item.allocations.forEach((allocation) => {
          // Calculate pack and unit quantities from the allocated total.
          const allocatedUnits = allocation.allocated;
          const packQuantity = Math.floor(allocatedUnits / unitsInPack);
          const unitQuantity = allocatedUnits % unitsInPack;
          const subtotal =
            packQuantity * item.packPrice + unitQuantity * item.unitPrice;
          flattenedItems.push({
            productId: item.productId,
            batchNumber: allocation.batchNumber,
            packQuantity,
            unitQuantity,
            packPrice: item.packPrice,
            unitPrice: item.unitPrice,
            subtotal,
          });
        });
      } else {
        flattenedItems.push({
          productId: item.productId,
          batchNumber: item.batchNumber,
          packQuantity: item.packQuantity,
          unitQuantity: item.unitQuantity,
          packPrice: item.packPrice,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        });
      }
    });
    // Replace the items array with the flattened items.
    order.items = flattenedItems;

    // --- VALIDATE EACH ORDER ITEM ---
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const batch = product.batches.find(
        (b) => b.batchNumber === item.batchNumber
      );
      if (!batch) {
        throw new Error(
          `Batch ${item.batchNumber} not found for product ${product.name}`
        );
      }

      const totalUnitsOrdered =
        item.packQuantity * product.unitsInPack + item.unitQuantity;
      if (batch.quantity < totalUnitsOrdered) {
        throw new Error(
          `Insufficient stock for ${product.name} in batch ${item.batchNumber}. Available: ${batch.quantity}, Required: ${totalUnitsOrdered}`
        );
      }

      if (item.packPrice <= 0 || item.unitPrice <= 0) {
        throw new Error(`Invalid prices for product ${product.name}`);
      }

      const calculatedSubtotal =
        item.packQuantity * item.packPrice + item.unitQuantity * item.unitPrice;
      if (Math.abs(calculatedSubtotal - item.subtotal) > 0.01) {
        throw new Error(`Subtotal mismatch for product ${product.name}`);
      }
    }

    const calculatedTotal = order.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    if (Math.abs(calculatedTotal - order.totalAmount) > 0.01) {
      throw new Error("Order total amount mismatch");
    }

    // --- CREATE THE ORDER ---
    // Note: We are still storing customerDetails in the same format.
    const newOrder = await Order.create({
      ...order,
      customerDetails: order.customerDetails
        ? {
            name: order.customerDetails.fullname,
            email: order.customerDetails.email,
            phone: order.customerDetails.phone,
            address: order.customerDetails.address,
          }
        : { name: "Walk-in" },
    });

    // --- UPDATE PRODUCT BATCHES ---
    // For each order item, update the corresponding product batch inventory.
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      const batchIndex = product.batches.findIndex(
        (b) => b.batchNumber === item.batchNumber
      );
      const totalUnitsOrdered =
        item.packQuantity * product.unitsInPack + item.unitQuantity;
      product.batches[batchIndex].quantity -= totalUnitsOrdered;
      await product.save();
    }

    res.status(201).json({
      success: true,
      data: newOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// (The rest of your controller functions remain unchanged.)
exports.getOrders = async (req, res) => {
  try {
    const query = {};
    const page = parseInt(req.query.page) || 1;
    const orders = await Order.find(query)
      .populate("items.productId", "name code unitsInPack")
      .populate("createdBy", "fullname")
      .populate("lastAction.performedBy", "name")
      .sort("-createdAt");
    const total = await Order.countDocuments(query);
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.productId", "name code unitsInPack")
      .populate("createdBy", "name")
      .populate("lastAction.performedBy", "name");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new Error("Order not found");
    }
    const allowedUpdates = ["paymentStatus", "amountPaid", "balance"];
    const updates = Object.keys(req.body).filter((key) =>
      allowedUpdates.includes(key)
    );
    if (updates.length === 0) {
      throw new Error("No valid update fields provided");
    }
    updates.forEach((update) => {
      order[update] = req.body[update];
    });
    order.lastAction = {
      action: "update",
      performedBy: req.user.id,
      createdAt: new Date(),
      reason: req.body.reason || "Payment update",
    };
    await order.save();
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    order.lastAction = {
      action: "delete",
      performedBy: req.user.id,
      createdAt: new Date(),
      reason: req.body.reason || "Order deleted",
    };
    await order.save();
    await order.remove();
    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
