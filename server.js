require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 FinTracker API running on http://localhost:${PORT}`);
  });
});

// Important for Vercel
module.exports = app;