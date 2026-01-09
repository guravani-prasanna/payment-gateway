const express = require("express");
const router = express.Router();
const pool = require("./db");

/* ================= HELPERS ================= */

function generateOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "order_";
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/* ================= CREATE ORDER ================= */

router.post("/api/v1/orders", async (req, res) => {
  const { amount, currency = "INR", receipt = null, notes = {} } = req.body;

  if (!Number.isInteger(amount) || amount < 100) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "amount must be at least 100 paise"
      }
    });
  }

  let orderId;
  do {
    orderId = generateOrderId();
  } while ((await pool.query("SELECT 1 FROM orders WHERE id=$1", [orderId])).rows.length);

  const r = await pool.query(
    `INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,'created')
     RETURNING id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at`,
    [orderId, req.merchant.id, amount, currency, receipt, notes]
  );

  res.status(201).json(r.rows[0]);
});

/* ================= GET ORDER (AUTH) ================= */

router.get("/api/v1/orders/:id", async (req, res) => {
  const r = await pool.query(
    `SELECT id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at
     FROM orders WHERE id=$1 AND merchant_id=$2`,
    [req.params.id, req.merchant.id]
  );

  if (!r.rows.length) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Order not found"
      }
    });
  }

  res.json(r.rows[0]);
});

/* ================= PUBLIC ORDER FETCH FOR CHECKOUT ================= */

router.get("/api/v1/orders/:id/public", async (req, res) => {
  const r = await pool.query(
    `SELECT id, amount, currency, status FROM orders WHERE id=$1`,
    [req.params.id]
  );

  if (!r.rows.length) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Order not found"
      }
    });
  }

  res.json(r.rows[0]);
});

module.exports = router;