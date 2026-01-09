require("dotenv").config();
const express = require("express");
const cors = require("cors");

const pool = require("./db");
const auth = require("./auth");
const orderRoutes = require("./orders");
const paymentRoutes = require("./payments");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

/* ================= HEALTH CHECK ================= */
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch {
    res.json({
      status: "healthy",
      database: "disconnected",
      timestamp: new Date().toISOString()
    });
  }
});

/* ================= TEST MERCHANT ================= */
app.get("/api/v1/test/merchant", async (req, res) => {
  const r = await pool.query(
    "SELECT id,email,api_key FROM merchants WHERE email='test@example.com'"
  );
  if (!r.rows.length) return res.sendStatus(404);

  res.json({ ...r.rows[0], seeded: true });
});

/* ================= AUTH MIDDLEWARE ================= */
app.use((req, res, next) => {
  if (req.path.includes("/public")) return next();
  if (req.path === "/health") return next();
  if (req.path === "/api/v1/test/merchant") return next();
  return auth(req, res, next);
});

/* ================= ROUTES ================= */
app.use(orderRoutes);
app.use(paymentRoutes);

app.listen(8000, () => console.log("API running on port 8000"));