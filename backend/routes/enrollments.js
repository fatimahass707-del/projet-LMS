const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Enrollments route works" });
});

module.exports = router;
