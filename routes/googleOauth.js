const express = require("express");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const pool = require("../db");

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/* STEP 1: Redirect to Google */
router.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
  });

  res.redirect(url);
});

/* STEP 2: Google Callback */
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client,
    });

    const { data } = await oauth2.userinfo.get();
    const email = data.email;
    const name = data.name;

    // Check if user exists
    let user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    // If not, create user
    if (!user.rows.length) {
      user = await pool.query(
        "INSERT INTO users (email, name) VALUES ($1,$2) RETURNING *",
        [email, name]
      );
    }

    const token = jwt.sign(
      { userId: user.rows[0].id },
      process.env.JWT_SECRET
    );

    // Redirect to frontend with token
    res.redirect(
      `http://localhost:3000/dashboard?token=${token}`
    );
  } catch (err) {
    console.error(err);
    res.redirect("http://localhost:3000/login");
  }
});

module.exports = router;
