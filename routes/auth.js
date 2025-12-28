const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");

const router = express.Router();

/* SIGNUP */
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1,$2)",
      [email, hashed]
    );
    res.json({ success: true });
  } catch {
    res.status(400).json({ message: "Wrong credentials" });
  }
});

/* LOGIN */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (!user.rows.length)
    return res.status(400).json({ message: "Wrong credentials" });

  const match = await bcrypt.compare(password, user.rows[0].password);
  if (!match)
    return res.status(400).json({ message: "Wrong credentials" });

  const token = jwt.sign(
    { userId: user.rows[0].id },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

/* FORGOT PASSWORD */
router.post("/forgot-password", async (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  await pool.query(
    "UPDATE users SET reset_token=$1 WHERE email=$2",
    [token, req.body.email]
  );

  console.log("RESET LINK:");
  console.log(`http://localhost:3000/reset-password?token=${token}`);

  res.json({ success: true });
});

/* RESET PASSWORD */
router.post("/reset-password", async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  await pool.query(
    "UPDATE users SET password=$1, reset_token=NULL WHERE reset_token=$2",
    [hashed, req.body.token]
  );
  res.json({ success: true });
});

module.exports = router;
