const mongoose = require("mongoose");

/**
 * GET /api/system-health
 * Returns REAL server process metrics, actual MongoDB database ping latency,
 * real Node.js memory usage, server uptime, and configuration status.
 */
exports.getHealthStatus = async (req, res, next) => {
  try {
    const startTime = Date.now();
    let dbStatus = "disconnected";
    let dbLatencyMs = 0;

    // 1. Measure real MongoDB Connection State & Ping Latency
    if (mongoose.connection.readyState === 1) {
      dbStatus = "connected";
      try {
        const pingStart = Date.now();
        await mongoose.connection.db.admin().ping();
        dbLatencyMs = Date.now() - pingStart;
      } catch (pingErr) {
        dbLatencyMs = Date.now() - startTime;
      }
    }

    // 2. Measure Server Process Memory Usage
    const memory = process.memoryUsage();
    const heapUsedMb = (memory.heapUsed / 1024 / 1024).toFixed(1);
    const heapTotalMb = (memory.heapTotal / 1024 / 1024).toFixed(1);
    const rssMb = (memory.rss / 1024 / 1024).toFixed(1);

    // 3. Measure Server Process Uptime
    const uptimeSec = Math.floor(process.uptime());
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const secs = uptimeSec % 60;

    const uptimeParts = [];
    if (days > 0) uptimeParts.push(`${days}d`);
    if (hours > 0) uptimeParts.push(`${hours}h`);
    if (mins > 0 || hours > 0) uptimeParts.push(`${mins}m`);
    uptimeParts.push(`${secs}s`);

    // 4. Check Integration Configurations
    const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
    const isEmailConfigured = Boolean(process.env.EMAIL_USER || process.env.SMTP_USER);

    // 5. Calculate Total Server API Handler Latency
    const apiLatencyMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        status: dbStatus === "connected" ? "operational" : "degraded",
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
        uptimeSeconds: uptimeSec,
        uptimeFormatted: uptimeParts.join(" "),
        database: {
          status: dbStatus,
          connectionState: mongoose.connection.readyState,
          latencyMs: dbLatencyMs,
          dbName: mongoose.connection.name || "fintracker",
        },
        memory: {
          heapUsedMb: parseFloat(heapUsedMb),
          heapTotalMb: parseFloat(heapTotalMb),
          rssMb: parseFloat(rssMb),
        },
        stripe: {
          configured: isStripeConfigured,
        },
        email: {
          configured: isEmailConfigured,
        },
        apiLatencyMs,
      },
    });
  } catch (err) {
    next(err);
  }
};
