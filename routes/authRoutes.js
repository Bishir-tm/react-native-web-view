const express = require("express");
const {
  register,
  login,
  requestPasswordReset,
  handlePasswordReset,
  getCurrentUser,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/request-password-reset", requestPasswordReset);
router.post("/handle-password-reset", handlePasswordReset);
router.get("/me", getCurrentUser);

module.exports = router;
