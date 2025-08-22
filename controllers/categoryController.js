const Category = require("../models/Category");
const Product = require("../models/Product");
const logAction = require("../utils/logAction");

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ deletedAt: null }).sort({
      createdAt: -1,
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category || category.deletedAt) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    // Check for duplicate name, including deleted categories
    const duplicateCategory = await Category.findOne({ name: req.body.name });
    if (duplicateCategory) {
      if (duplicateCategory.deletedAt) {
        return res
          .status(400)
          .json({ message: "This category was deleted. Restore instead?" });
      }
      return res.status(400).json({ message: "This category already exists" });
    }

    const category = new Category({
      name: req.body.name,
      description: req.body.description,
    });

    const savedCategory = await category.save();

    // Log the category creation
    await logAction(
      req.user.id,
      "Category",
      savedCategory._id,
      "create",
      null,
      savedCategory,
      `Created new category: ${req.body.name}`
    );

    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { name, description } = req.body;

    const oldCategory = await Category.findById(req.params.id);
    if (!oldCategory || oldCategory.deletedAt) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );

    // Log the update
    await logAction(
      req.user.id,
      "Category",
      req.params.id,
      "edit",
      oldCategory,
      updatedCategory,
      `Updated category: ${oldCategory.name} to ${name}`
    );

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete a category and disassociate products
exports.deleteCategory = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const categoryToDelete = await Category.findById(req.params.id);
    if (!categoryToDelete || categoryToDelete.deletedAt) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Disassociate products
    await Product.updateMany({ category: req.params.id }, { category: null });

    // Soft delete the category
    await Category.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });

    // Log the deletion
    await logAction(
      req.user.id,
      "Category",
      req.params.id,
      "delete",
      categoryToDelete,
      null,
      `Deleted category: ${categoryToDelete.name}. Products disassociated`
    );

    res.status(200).json({
      message: "Category deleted and products disassociated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete the category" });
  }
};

module.exports = exports;
