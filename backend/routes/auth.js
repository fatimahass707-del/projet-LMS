const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Auth route works" });
});

module.exports = router;