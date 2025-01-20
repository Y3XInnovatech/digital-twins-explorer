const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

const MODELS_FILE_PATH = path.join(__dirname, "models.json");

app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Handle CORS Preflight Requests
app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(200).end();
});

// GET /models
// eslint-disable-next-line consistent-return
app.get("/models", (req, res) => {
  try {
    if (!fs.existsSync(MODELS_FILE_PATH)) {
      return res.status(404).json({ error: "models.json file not found" });
    }

    const modelsData = fs.readFileSync(MODELS_FILE_PATH, "utf-8");
    const parsedData = JSON.parse(modelsData);

    if (!parsedData.value || !Array.isArray(parsedData.value)) {
      return res.status(500).json({ error: "Invalid models data format" });
    }
    res.status(200).json(parsedData.value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error reading models.json:", err.message);
    res.status(500).json({ error: "Failed to load models" });
  }
});

// POST /models
// eslint-disable-next-line consistent-return
app.post("/models", (req, res) => {
  try {
    let newModels = req.body;

    if (!Array.isArray(newModels)) {
      newModels = [ newModels ];
    }

    if (
      !newModels.every(
        model => model["@id"] && model["@type"] && model["@context"]
      )
    ) {
      return res.status(400).json({ error: "Invalid model structure." });
    }

    let existingData = { value: [], nextLink: null };
    if (fs.existsSync(MODELS_FILE_PATH)) {
      // eslint-disable-next-line no-console
      console.log("models.json exists. Reading file...");
      const modelsData = fs.readFileSync(MODELS_FILE_PATH, "utf-8");

      // eslint-disable-next-line no-negated-condition
      if (modelsData.trim() !== "") {
        try {
          existingData = JSON.parse(modelsData);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error parsing models.json:", error.message);
          existingData = { value: [], nextLink: null };
        }
      } else {
        // eslint-disable-next-line no-console
        console.log("models.json is empty. Initializing default structure.");
        existingData = { value: [], nextLink: null };
      }
    } else {
      // eslint-disable-next-line no-console
      console.log("models.json does not exist. Creating a new file.");
      fs.writeFileSync(
        MODELS_FILE_PATH,
        JSON.stringify({ value: [], nextLink: null }, null, 2)
      );
    }

    const updatedModels = [
      ...existingData.value,
      ...newModels.map(model => ({
        id: model["@id"],
        description: {},
        displayName: {
          en: model.displayName || "Unnamed Model"
        },
        decommissioned: false,
        uploadTime: new Date().toISOString(),
        model
      }))
    ];

    existingData.value = updatedModels;

    fs.writeFileSync(MODELS_FILE_PATH, JSON.stringify(existingData, null, 2));

    res.status(200).json({ message: "Models uploaded successfully." });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error uploading models:", error.message);
    res.status(500).json({ error: "Failed to upload models." });
  }
});

// DELETE /models
// eslint-disable-next-line consistent-return
app.delete("/models", (req, res) => {
  try {
    if (!fs.existsSync(MODELS_FILE_PATH)) {
      return res.status(404).json({ error: "models.json file not found" });
    }

    const existingData = JSON.parse(fs.readFileSync(MODELS_FILE_PATH, "utf-8"));

    // Clear the value array
    existingData.value = [];

    // Write the updated data back to models.json
    fs.writeFileSync(MODELS_FILE_PATH, JSON.stringify(existingData, null, 2));

    res.status(200).json({ message: "All models deleted successfully." });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting all models:", error.message);
    res.status(500).json({ error: "Failed to delete all models." });
  }
});

// Handle 404 - Route Not Found
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start the server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
