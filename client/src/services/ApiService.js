import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const MODELS_FILE_PATH = path.join(__dirname, "./models.json");
const TWINS_FILE_PATH = path.join(__dirname, "./twins.json");

class ApiService {

  constructor() {
    this.models = [];
    this.twins = [];
  }

  /**
   * Load models from the local models.json file.
   */
  // eslint-disable-next-line require-await
  async loadModels() {
    try {
      if (fs.existsSync(MODELS_FILE_PATH)) {
        const modelsData = fs.readFileSync(MODELS_FILE_PATH, "utf-8");
        this.models = JSON.parse(modelsData);
        // eslint-disable-next-line no-console
        console.log("Models loaded successfully.");
      } else {
        // eslint-disable-next-line no-console
        console.warn("models.json not found. Ensure the file exists.");
        this.models = [];
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error loading models: ${err.message}`);
      throw err;
    }
  }

  /**
   * Load twins from the local twins.json file.
   */
  // eslint-disable-next-line require-await
  async loadTwins() {
    try {
      if (fs.existsSync(TWINS_FILE_PATH)) {
        const twinsData = fs.readFileSync(TWINS_FILE_PATH, "utf-8");
        this.twins = JSON.parse(twinsData);
        // eslint-disable-next-line no-console
        console.log("Twins loaded successfully.");
      } else {
        // eslint-disable-next-line no-console
        console.warn("twins.json not found. Ensure the file exists.");
        this.twins = [];
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error loading twins: ${err.message}`);
      throw err;
    }
  }

  /**
   * Save models to the local models.json file.
   */
  saveModels() {
    try {
      fs.writeFileSync(MODELS_FILE_PATH, JSON.stringify(this.models, null, 2));
      // eslint-disable-next-line no-console
      console.log("Models saved successfully.");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error saving models: ${err.message}`);
      throw err;
    }
  }

  /**
   * Save twins to the local twins.json file.
   */
  saveTwins() {
    try {
      fs.writeFileSync(TWINS_FILE_PATH, JSON.stringify(this.twins, null, 2));
      // eslint-disable-next-line no-console
      console.log("Twins saved successfully.");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error saving twins: ${err.message}`);
      throw err;
    }
  }

  /**
   * Query all models.
   */
  async queryModels() {
    await this.loadModels();
    return this.models;
  }

  /**
   * Get a specific model by ID.
   * @param {string} modelId - The ID of the model to retrieve.
   */
  async getModelById(modelId) {
    await this.loadModels();
    const model = this.models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model with ID ${modelId} not found.`);
    }
    return model;
  }

  /**
   * Add new models.
   * @param {Array} models - Array of models to add.
   */
  async addModels(models) {
    await this.loadModels();
    this.models.push(...models);
    this.saveModels();
    // eslint-disable-next-line no-console
    console.log(`${models.length} models added successfully.`);
  }

  /**
   * Delete a model by ID.
   * @param {string} modelId - The ID of the model to delete.
   */
  async deleteModel(modelId) {
    await this.loadModels();
    const initialLength = this.models.length;
    this.models = this.models.filter(model => model.id !== modelId);
    if (this.models.length === initialLength) {
      throw new Error(`Model with ID ${modelId} not found.`);
    }
    this.saveModels();
    // eslint-disable-next-line no-console
    console.log(`Model with ID ${modelId} deleted successfully.`);
  }

  /**
   * Query all twins.
   */
  async getAllTwins() {
    await this.loadTwins();
    return this.twins;
  }

  /**
   * Get a specific twin by ID.
   * @param {string} twinId - The ID of the twin to retrieve.
   */
  async getTwinById(twinId) {
    await this.loadTwins();
    const twin = this.twins.find(t => t.$dtId === twinId);
    if (!twin) {
      throw new Error(`Twin with ID ${twinId} not found.`);
    }
    return twin;
  }

  /**
   * Add new twins.
   * @param {Array} twins - Array of twins to add.
   */
  async addTwins(twins) {
    await this.loadTwins();
    this.twins.push(...twins);
    this.saveTwins();
    // eslint-disable-next-line no-console
    console.log(`${twins.length} twins added successfully.`);
  }

  /**
   * Delete a twin by ID.
   * @param {string} twinId - The ID of the twin to delete.
   */
  async deleteTwin(twinId) {
    await this.loadTwins();
    const initialLength = this.twins.length;
    this.twins = this.twins.filter(twin => twin.$dtId !== twinId);
    if (this.twins.length === initialLength) {
      throw new Error(`Twin with ID ${twinId} not found.`);
    }
    this.saveTwins();
    // eslint-disable-next-line no-console
    console.log(`Twin with ID ${twinId} deleted successfully.`);
  }

  /**
   * Get all relationships of a twin.
   * @param {string} twinId - The ID of the twin to retrieve relationships for.
   */
  async getRelationships(twinId) {
    await this.loadTwins();
    const relationships = this.twins
      .filter(twin => twin.$sourceId === twinId || twin.$targetId === twinId)
      .map(twin => twin.relationships || []);
    return relationships.flat();
  }

  /**
   * Delete a relationship by ID.
   * @param {string} twinId - The ID of the twin that owns the relationship.
   * @param {string} relationshipId - The ID of the relationship to delete.
   */
  async deleteRelationship(twinId, relationshipId) {
    await this.loadTwins();
    const twin = this.twins.find(t => t.$dtId === twinId);
    if (!twin || !twin.relationships) {
      throw new Error(`Twin or relationships for twin ID ${twinId} not found.`);
    }
    const initialLength = twin.relationships.length;
    twin.relationships = twin.relationships.filter(
      rel => rel.$relationshipId !== relationshipId
    );
    if (twin.relationships.length === initialLength) {
      throw new Error(`Relationship with ID ${relationshipId} not found.`);
    }
    this.saveTwins();
    // eslint-disable-next-line no-console
    console.log(`Relationship with ID ${relationshipId} deleted successfully.`);
  }

}

export const apiService = new ApiService();
