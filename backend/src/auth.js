const pool = require("./db");

module.exports = async function (req, res, next) {
  // Allow public and health routes without auth
  if (
    req.path === "/health" ||
    req.path.startsWith("/api/v1/test") ||
    req.path.includes("/public")
  ) {
    return next();
  }

  const apiKey = req.header("X-Api-Key");
  const apiSecret = req.header("X-Api-Secret");

  if (!apiKey || !apiSecret) {
    return res.status(401).json({
      error: {
        code: "AUTHENTICATION_ERROR",
        description: "Invalid API credentials"
      }
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM merchants WHERE api_key=$1 AND api_secret=$2 AND is_active=true",
      [apiKey, apiSecret]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_ERROR",
          description: "Invalid API credentials"
        }
      });
    }

    req.merchant = result.rows[0];
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.sendStatus(500);
  }
};