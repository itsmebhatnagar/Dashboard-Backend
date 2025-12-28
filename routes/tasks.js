const express = require("express");
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const data = await pool.query(
    "SELECT * FROM tasks WHERE user_id=$1 ORDER BY id DESC",
    [req.userId]
  );
  res.json(data.rows);
});

router.post("/", auth, async (req, res) => {
  await pool.query(
    "INSERT INTO tasks (title,user_id) VALUES ($1,$2)",
    [req.body.title, req.userId]
  );
  res.json({ success: true });
});

router.put("/:id", auth, async (req, res) => {
  await pool.query(
    "UPDATE tasks SET completed=true WHERE id=$1 AND user_id=$2",
    [req.params.id, req.userId]
  );
  res.json({ success: true });
});

router.delete("/:id", auth, async (req, res) => {
  await pool.query(
    "DELETE FROM tasks WHERE id=$1 AND user_id=$2",
    [req.params.id, req.userId]
  );
  res.json({ success: true });
});

module.exports = router;
