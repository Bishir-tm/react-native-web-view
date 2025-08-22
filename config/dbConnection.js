const mongoose = require("mongoose");

module.exports = connectToDB = () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017/inventory")
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((err) => console.error("Databse connection error:", err));
};
