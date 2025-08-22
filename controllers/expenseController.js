const Expense = require("../models/Expense");
const logAction = require("../utils/logAction");

// Add a new expense
const createExpense = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { date, category, amount, description, paymentMethod, invoice } =
      req.body;
    const createdBy = req.user.id;
    if (
      !date ||
      !category ||
      !amount ||
      !description ||
      !paymentMethod ||
      !createdBy
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const expense = new Expense({
      date,
      category,
      amount,
      description,
      paymentMethod,
      invoice,
      createdBy,
    });
    const savedExpense = await expense.save();

    // Log the expense creation
    await logAction(
      req.user.id,
      "Expense",
      savedExpense._id,
      "create",
      null,
      savedExpense,
      `Created new ${category} expense of ${amount}`
    );

    res.status(201).json(savedExpense);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid request data" });
    } else if (error.code === 11000) {
      return res.status(400).json({ message: "Expense already exists" });
    } else {
      return res.status(500).json({ message: "Failed to add expense" });
    }
  }
};

// Get all expenses
const getAllExpenses = async (req, res) => {
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
    const expenses = await Expense.find()
      .sort({ updatedAt: -1 })
      .populate("createdBy", "fullname");
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};

// Get a single expense by ID
const getExpenseById = async (req, res) => {
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
    const expense = await Expense.findById(id);

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expense" });
  }
};

// Update an expense
const updateExpense = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Get the old expense data for logging
    const oldExpense = await Expense.findById(id);
    if (!oldExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    // Log the expense update
    await logAction(
      req.user.id,
      "Expense",
      id,
      "update",
      oldExpense,
      updatedExpense,
      `Updated ${updatedExpense.category} expense`
    );

    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: "Failed to update expense" });
  }
};

// Delete an expense
const deleteExpense = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Unauthorized to perform this action." });
  }

  try {
    const { id } = req.params;
    const expenseToDelete = await Expense.findById(id);

    if (!expenseToDelete) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await Expense.findByIdAndDelete(id);

    // Log the expense deletion
    await logAction(
      req.user.id,
      "Expense",
      id,
      "delete",
      expenseToDelete,
      null,
      `Deleted ${expenseToDelete.category} expense of ${expenseToDelete.amount}`
    );

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete expense" });
  }
};

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
