const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in environment variables");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

pool.on("connect", () => {
  console.log("✅ Connected to Postgres");
});

pool.on("error", (err) => {
  console.error("❌ Postgres connection error:", err);
});

module.exports = pool;