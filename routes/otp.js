const express = require("express");
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const sendMail = require("../utils/sendMail");

const router = express.Router();

/* SEND OTP */
router.post("/send", auth, async (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  await pool.query(
    "UPDATE users SET otp=$1, otp_expires=$2 WHERE id=$3",
    [otp, expires, req.userId]
  );

  const user = await pool.query(
    "SELECT email FROM users WHERE id=$1",
    [req.userId]
  );

  await sendMail(user.rows[0].email, otp);
  res.json({ success: true });
});

/* VERIFY OTP & CHANGE PASSWORD */
router.post("/verify", auth, async (req, res) => {
  const { otp, newPassword } = req.body;

  const user = await pool.query(
    "SELECT otp, otp_expires FROM users WHERE id=$1",
    [req.userId]
  );

  if (
    user.rows[0].otp !== otp ||
    new Date() > user.rows[0].otp_expires
  ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const bcrypt = require("bcrypt");
  const hash = await bcrypt.hash(newPassword, 10);

  await pool.query(
    "UPDATE users SET password=$1, otp=NULL, otp_expires=NULL WHERE id=$2",
    [hash, req.userId]
  );

  res.json({ success: true });
});

module.exports = router;
