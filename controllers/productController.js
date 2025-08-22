const Product = require("../models/Product");
const logAction = require("../utils/logAction"); // Import log function

// Get a single product by ID
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.status(200).json(product);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    res.status(500).json({
      message: "Failed to fetch the product. Please try again later.",
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  if (!["admin", "manager", "staff"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const products = await Product.find().sort({ updatedAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch products. Please try again later." });
  }
};

// Add a new product
const addNewProduct = async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Unauthorized to add a product." });
  }

  const {
    name,
    category,
    barcodeOrSku,
    unitsInPack,
    description,
    standardPackPrice = 0,
    standardUnitPrice = 0,
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: "Name and category are required." });
  }

  try {
    const existingProductWithName = await Product.findOne({ name });
    const existingProductWithBarcode = await Product.findOne({ barcodeOrSku });

    if (existingProductWithName) {
      return res
        .status(400)
        .json({ message: "A product with the same name already exists." });
    }

    if (existingProductWithBarcode) {
      return res
        .status(400)
        .json({ message: "A product with the same barcode already exists." });
    }

    const newProduct = new Product({
      name,
      category,
      unitsInPack,
      description,
      standardPackPrice,
      standardUnitPrice,
      barcodeOrSku: barcodeOrSku || null,
      lastAction: {
        action: "create",
        performedBy: req.user.id,
        createdAt: new Date(),
        reason: "Initial product creation",
      },
    });

    const savedProduct = await newProduct.save();

    await logAction(
      req.user.id,
      "Product",
      savedProduct._id,
      "create",
      null,
      savedProduct,
      `Created new product: ${name}`
    );

    res.status(201).json(savedProduct);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add the product. Please try again later." });
  }
};

// Update an existing product
const updateProduct = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }
  const { id } = req.params;
  const {
    name,
    category,
    barcodeOrSku,
    standardPackPrice,
    standardUnitPrice,
    unitsInPack,
    description,
  } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Store old product state for logging
    const oldProduct = { ...product.toObject() };

    let barcodeConflict = false;
    let nameConflict = false;

    if (barcodeOrSku && barcodeOrSku !== product.barcodeOrSku) {
      const existingProductWithBarcode = await Product.findOne({
        barcodeOrSku,
      });
      if (existingProductWithBarcode) {
        barcodeConflict = true;
      }
    }

    if (name && name !== product.name) {
      const existingProductWithName = await Product.findOne({ name });
      if (existingProductWithName) {
        nameConflict = true;
      }
    }

    if (barcodeConflict) {
      return res.status(400).json({
        message: "A product with the same barcode already exists.",
      });
    }

    if (nameConflict) {
      return res.status(400).json({
        message: "A product with the same name already exists.",
      });
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.standardPackPrice = standardPackPrice || product.standardPackPrice;
    product.standardUnitPrice = standardUnitPrice || product.standardUnitPrice;
    product.barcodeOrSku = barcodeOrSku || product.barcodeOrSku;
    product.unitsInPack = unitsInPack || product.unitsInPack;
    product.description = description || product.description;

    const updatedProduct = await product.save();

    // Log the update action
    await logAction(
      req.user.id,
      "Product",
      id,
      "edit",
      oldProduct,
      updatedProduct,
      `Updated product: ${product.name}`
    );

    res.status(200).json(updatedProduct);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    res.status(500).json({
      message: "Failed to update the product. Please try again later.",
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Store product info for logging before deletion
    const deletedProduct = { ...product.toObject() };

    await Product.deleteOne({ _id: id });

    // Log the deletion action
    await logAction(
      req.user.id,
      "Product",
      id,
      "delete",
      deletedProduct,
      null,
      `Deleted product: ${product.name}`
    );

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    res.status(500).json({
      message: "Failed to delete the product. Please try again later.",
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  addNewProduct,
  updateProduct,
  deleteProduct,
};
