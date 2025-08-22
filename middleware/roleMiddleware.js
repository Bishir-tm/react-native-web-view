const roleMiddleware = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role; // Assuming req.user is set after authentication
    if (roles.includes(userRole)) {
      return next();
    }
    return res.status(403).json({ message: "Access denied" });
  };
};

module.exports = roleMiddleware;
