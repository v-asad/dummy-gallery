const express = require("express");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { db, initDb } = require("./db");
const { authMiddleware, generateToken } = require("./auth");
const fs = require("fs");

const app = express();
const upload = multer({ dest: path.join(__dirname, "uploads") });

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

initDb();

// User registration
app.post("/api/register", (req, res) => {
  const { username, password, bio } = req.body;
  if (!username || !password || !bio)
    return res.status(400).json({ error: "Missing fields" });
  try {
    db.prepare(
      "INSERT INTO users (username, password, bio) VALUES (?, ?, ?)"
    ).run(username, password, bio);
    return res.json({ success: true });
  } catch (e) {
    return res.status(400).json({ error: "Username already exists" });
  }
});

// User login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = db
    .prepare("SELECT * FROM users WHERE username = ? AND password = ?")
    .get(username, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const token = generateToken(user.id);
  res.json({ token });
});

// Get user profile
app.get("/api/user/:id", (req, res) => {
  const user = db
    .prepare("SELECT id, username, bio FROM users WHERE id = ?")
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// Upload photo
app.post("/api/photos", authMiddleware, upload.single("image"), (req, res) => {
  const { caption } = req.body;
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  // Preserve original extension
  const ext = path.extname(req.file.originalname);
  const oldPath = req.file.path;
  const newFilename = req.file.filename + ext;
  const newPath = path.join(req.file.destination, newFilename);

  fs.renameSync(oldPath, newPath);

  const stmt = db.prepare(
    "INSERT INTO photos (user_id, filename, caption, createdAt) VALUES (?, ?, ?, ?)"
  );
  const info = stmt.run(
    req.userId,
    newFilename,
    caption || "",
    Date.now()
  );
  res.json({ id: info.lastInsertRowid });
});

// Edit caption
app.put("/api/photos/:id", authMiddleware, (req, res) => {
  const { caption } = req.body;
  const photo = db
    .prepare("SELECT * FROM photos WHERE id = ?")
    .get(req.params.id);
  if (!photo || photo.user_id !== req.userId)
    return res.status(403).json({ error: "Forbidden" });
  db.prepare("UPDATE photos SET caption = ? WHERE id = ?").run(
    caption,
    req.params.id
  );
  res.json({ success: true });
});

// Delete photo
app.delete("/api/photos/:id", authMiddleware, (req, res) => {
  const photo = db
    .prepare("SELECT * FROM photos WHERE id = ?")
    .get(req.params.id);
  if (!photo || photo.user_id !== req.userId)
    return res.status(403).json({ error: "Forbidden" });
  db.prepare("DELETE FROM photos WHERE id = ?").run(req.params.id);
  // Optionally delete file from disk
  res.json({ success: true });
});

// Paginated feed
app.get("/api/feed", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const photos = db
    .prepare(
      "SELECT photos.*, users.username FROM photos JOIN users ON photos.user_id = users.id ORDER BY createdAt DESC LIMIT ? OFFSET ?"
    )
    .all(limit, offset);
  res.json(photos);
});

// Get photos by user
app.get("/api/photos/user/:userId", (req, res) => {
  const photos = db
    .prepare("SELECT * FROM photos WHERE user_id = ? ORDER BY createdAt DESC")
    .all(req.params.userId);
  res.json(photos);
});

const PORT = 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
