const User = require("../models/User");
const logAction = require("../utils/logAction"); // Import log function
const bcrypt = require("bcryptjs");

// Fetch all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// Fetch a single user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

// Create a new user
const createUser = async (req, res) => {
  const { fullname, email, role, password } = req.body;
  try {
    const newUser = new User({ fullname, email, password, role });
    await newUser.save();

    // Log action
    await logAction(
      req.user.id,
      "User",
      newUser._id,
      "create",
      null,
      newUser,
      "New user created"
    );

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
};

// Update user details
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullname, email, role, password } = req.body;
  try {
    const oldUser = await User.findById(id); // Get existing user details
    if (!oldUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { fullname, email, role, password: hashedPassword },
      { new: true, runValidators: true }
    );

    // Log action
    await logAction(
      req.user.id,
      "User",
      id,
      "edit",
      oldUser,
      updatedUser,
      "User details updated"
    );

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Log action
    await logAction(
      req.user.id,
      "User",
      id,
      "delete",
      deletedUser,
      null,
      "User deleted"
    );

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
