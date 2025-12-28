const express = require("express");
const { google } = require("googleapis");
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/* START OAUTH */
router.get("/connect", auth, (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state: req.userId, // IMPORTANT
  });

  res.redirect(url);
});

/* CALLBACK */
router.get("/callback", async (req, res) => {
  const { code, state } = req.query; // state = userId

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const channelRes = await youtube.channels.list({
      part: "snippet,statistics",
      mine: true,
    });

    const channel = channelRes.data.items[0];

    await pool.query(
      `UPDATE users SET
        youtube_access_token=$1,
        youtube_refresh_token=$2,
        youtube_channel_id=$3,
        youtube_channel_name=$4
       WHERE id=$5`,
      [
        tokens.access_token,
        tokens.refresh_token,
        channel.id,
        channel.snippet.title,
        state,
      ]
    );

    res.redirect("http://localhost:3000/analytics");
  } catch (err) {
    console.error(err);
    res.status(500).send("YouTube connection failed");
  }
});

module.exports = router;

router.get("/analytics", auth, async (req, res) => {
  const user = await pool.query(
    "SELECT youtube_access_token FROM users WHERE id=$1",
    [req.userId]
  );

  if (!user.rows[0].youtube_access_token)
    return res.status(403).json({ message: "YouTube not connected" });

  oauth2Client.setCredentials({
    access_token: user.rows[0].youtube_access_token,
  });

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  const response = await youtube.channels.list({
    part: "statistics,snippet",
    mine: true,
  });

  res.json(response.data.items[0]);
});
