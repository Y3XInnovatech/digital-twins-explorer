const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Path to the models.json file
const MODELS_FILE_PATH = path.join(__dirname, "models.json");

// Middleware to handle JSON parsing in case of POST/PUT requests in the future
app.use(express.json());

// Enable CORS for frontend communication
app.use((req, res, next) => {
  // eslint-disable-next-line line-comment-position, no-inline-comments
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins (adjust this in production)
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Endpoint to get all models
// eslint-disable-next-line consistent-return
app.get("/models", (req, res) => {
  try {
    // Check if the models.json file exists
    if (!fs.existsSync(MODELS_FILE_PATH)) {
      return res.status(404).json({ error: "models.json file not found" });
    }

    // Read and parse the models.json file
    const modelsData = fs.readFileSync(MODELS_FILE_PATH, "utf-8");
    const parsedData = JSON.parse(modelsData);

    // Validate and extract the models array from the "value" property
    if (!parsedData.value || !Array.isArray(parsedData.value)) {
      return res.status(500).json({ error: "Invalid models data format" });
    }

    // Send the models array as JSON
    res.status(200).json(parsedData.value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error reading models.json:", err.message);
    res.status(500).json({ error: "Failed to load models" });
  }
});

// Fallback for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start the server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
