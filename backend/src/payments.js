const express = require("express");
const router = express.Router();
const pool = require("./db");

/* ================= HELPERS ================= */

function randomId(prefix) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = prefix;
  for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

async function generateUniquePaymentId() {
  while (true) {
    const id = randomId("pay_");
    const r = await pool.query("SELECT 1 FROM payments WHERE id=$1", [id]);
    if (!r.rows.length) return id;
  }
}

function validateVPA(vpa) {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(vpa);
}

function luhnCheck(num) {
  num = num.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(num)) return false;

  let sum = 0, dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = parseInt(num[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function detectNetwork(num) {
  num = num.replace(/[\s-]/g, "");
  if (/^4/.test(num)) return "visa";
  if (/^5[1-5]/.test(num)) return "mastercard";
  if (/^3[47]/.test(num)) return "amex";
  if (/^(60|65|8[1-9])/.test(num)) return "rupay";
  return "unknown";
}

function validExpiry(m, y) {
  let year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
  let month = parseInt(m);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const exp = new Date(year, month);
  return exp >= new Date(now.getFullYear(), now.getMonth());
}

/* ================= PAYMENT CORE ================= */

async function processPayment(req, res, isPublic) {
  const { order_id, method } = req.body;

  const order = await pool.query("SELECT * FROM orders WHERE id=$1", [order_id]);
  if (!order.rows.length)
    return res.status(404).json({ error:{ code:"NOT_FOUND_ERROR", description:"Order not found" }});

  const orderData = order.rows[0];
  if (!isPublic && orderData.merchant_id !== req.merchant.id)
    return res.status(404).json({ error:{ code:"NOT_FOUND_ERROR", description:"Order not found" }});

  let vpa=null, card_network=null, card_last4=null;

  if(method==="upi"){
    if(!validateVPA(req.body.vpa))
      return res.status(400).json({ error:{ code:"INVALID_VPA", description:"VPA format invalid" }});
    vpa=req.body.vpa;
  }

  if(method==="card"){
    const c=req.body.card;
    if(!luhnCheck(c.number))
      return res.status(400).json({ error:{ code:"INVALID_CARD", description:"Card validation failed" }});
    if(!validExpiry(c.expiry_month,c.expiry_year))
      return res.status(400).json({ error:{ code:"EXPIRED_CARD", description:"Card expiry date invalid" }});
    card_network=detectNetwork(c.number);
    card_last4=c.number.slice(-4);
  }

  const paymentId=await generateUniquePaymentId();

  const r=await pool.query(
    `INSERT INTO payments (id,order_id,merchant_id,amount,currency,method,status,vpa,card_network,card_last4)
     VALUES ($1,$2,$3,$4,'INR',$5,'processing',$6,$7,$8) RETURNING *`,
    [paymentId,order_id,orderData.merchant_id,orderData.amount,method,vpa,card_network,card_last4]
  );

  const delay = process.env.TEST_MODE === "true"
    ? parseInt(process.env.TEST_PROCESSING_DELAY || 1000)
    : Math.floor(Math.random()*5000)+5000;

  const success = process.env.TEST_MODE === "true"
    ? process.env.TEST_PAYMENT_SUCCESS !== "false"
    : method === "upi" ? Math.random() < 0.9 : Math.random() < 0.95;

  setTimeout(async()=>{
    if(success)
      await pool.query("UPDATE payments SET status='success',updated_at=NOW() WHERE id=$1",[paymentId]);
    else
      await pool.query(
        `UPDATE payments SET status='failed',error_code='PAYMENT_FAILED',
         error_description='Payment failed at bank',updated_at=NOW() WHERE id=$1`,
        [paymentId]
      );
  },delay);

  res.status(201).json(r.rows[0]);
}

/* ================= ROUTES ================= */

router.post("/api/v1/payments",(req,res)=>processPayment(req,res,false));
router.post("/api/v1/payments/public",(req,res)=>processPayment(req,res,true));

router.get("/api/v1/payments/:id",async(req,res)=>{
  const r=await pool.query(
    "SELECT * FROM payments WHERE id=$1 AND merchant_id=$2",
    [req.params.id,req.merchant.id]
  );
  if(!r.rows.length) return res.sendStatus(404);
  res.json(r.rows[0]);
});

router.get("/api/v1/payments/:id/public",async(req,res)=>{
  const r=await pool.query("SELECT * FROM payments WHERE id=$1",[req.params.id]);
  if(!r.rows.length) return res.sendStatus(404);
  res.json(r.rows[0]);
});

/* DASHBOARD TRANSACTIONS */

router.get("/api/v1/dashboard/transactions", async (req,res)=>{
  const r=await pool.query(`
    SELECT id,order_id,amount,method,status,created_at
    FROM payments WHERE merchant_id=$1 ORDER BY created_at DESC
  `,[req.merchant.id]);
  res.json(r.rows);
});

/* DASHBOARD STATS */

router.get("/api/v1/dashboard/stats", async (req,res)=>{
  const total=await pool.query("SELECT COUNT(*) FROM payments WHERE merchant_id=$1",[req.merchant.id]);
  const success=await pool.query(
    "SELECT COUNT(*) AS count,COALESCE(SUM(amount),0) AS sum FROM payments WHERE merchant_id=$1 AND status='success'",
    [req.merchant.id]
  );

  const t=parseInt(total.rows[0].count);
  const s=parseInt(success.rows[0].count);
  const amt=parseInt(success.rows[0].sum);

  res.json({
    total_transactions:t,
    total_amount:amt,
    success_rate:t===0?0:Math.round((s/t)*100)
  });
});

module.exports = router;