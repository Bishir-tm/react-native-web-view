const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Extract the token from the 'Authorization' header
  const token = req.header("authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, "68149540");
    req.user = decoded;
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Token has expired"
        : "Token is not valid";
    res.status(401).json({ message });
  }
};

module.exports = authMiddleware;
