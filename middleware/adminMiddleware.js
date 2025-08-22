const jwt = require("jsonwebtoken");

const adminMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, "68149540");
    req.user = decoded;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Token has expired"
        : "Token is not valid";
    res.status(401).json({ message });
  }
};

module.exports = adminMiddleware;
