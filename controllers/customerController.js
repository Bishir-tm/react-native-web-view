const Customer = require("../models/Customer");
const logAction = require("../utils/logAction"); // Import log function

// Fetch all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch customers" });
  }
};

// Fetch a single customer by ID
const getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch customer" });
  }
};

// Create a new customer
const createCustomer = async (req, res) => {
  const { fullname, phone, email, address, debtLimit } = req.body;

  if (!fullname || !phone) {
    return res
      .status(400)
      .json({ success: false, message: "Fullname and phone are required" });
  }

  const existingCustomer = await Customer.findOne({ phone });
  if (existingCustomer) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number already exists" });
  }

  try {
    const newCustomer = new Customer({
      fullname,
      phone,
      email,
      address,
      debtLimit,
    });

    await newCustomer.save();

    // Log action
    await logAction(
      req.user.id,
      "Customer",
      newCustomer._id,
      "create",
      null,
      newCustomer,
      "New customer created"
    );

    res.status(201).json({ success: true, data: newCustomer });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create customer" });
  }
};

// Update customer details
const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { fullname, phone, email, address, debtLimit } = req.body;
  try {
    const oldCustomer = await Customer.findById(id); // Get existing customer details
    if (!oldCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { fullname, phone, email, address, debtLimit },
      { new: true, runValidators: true }
    );

    // Log action
    await logAction(
      req.user.id,
      "Customer",
      id,
      "edit",
      oldCustomer,
      updatedCustomer,
      "Customer details updated"
    );

    res.status(200).json({ success: true, data: updatedCustomer });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update customer" });
  }
};

// Delete a customer
const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Log action
    await logAction(
      req.user.id,
      "Customer",
      id,
      "delete",
      deletedCustomer,
      null,
      "Customer deleted"
    );

    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete customer" });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
