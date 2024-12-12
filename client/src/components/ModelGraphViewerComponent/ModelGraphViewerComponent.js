// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

import { ModelGraphViewerCytoscapeComponent } from "./ModelGraphViewerCytoscapeComponent/ModelGraphViewerCytoscapeComponent";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { eventService } from "../../services/EventService";

import "./ModelGraphViewerComponent.scss";

class ModelGraphViewerComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      // eslint-disable-next-line react/no-unused-state
      layout: "d3Force",
      // eslint-disable-next-line line-comment-position, no-inline-comments, react/no-unused-state
      progress: 0 // Track progress for loading
    };
    this.cyRef = React.createRef();
    // eslint-disable-next-line line-comment-position, no-inline-comments
    this.isInitialized = false; // Track if the component is initialized
  }

  // Method to initialize the component
  initialize = async () => {
    if (!this.isInitialized) {
      this.isInitialized = true;

      // Subscribe to various events
      eventService.subscribeModelsUpdate(() => {
        this.retrieveModels();
      });

      eventService.subscribeClearModelsData(() => {
        if (this.cyRef.current) {
          this.cyRef.current.clearNodes();
        }
        this.setState({ isLoading: false });
      });

      eventService.subscribeSelectModel(item => {
        if (item) {
          this.highlightNodes(item.key);
        } else {
          this.clearHighlights();
        }
      });

      // Fetch and display models
      await this.retrieveModels();
    }
  };

  // Method to fetch models and update the graph
  async retrieveModels() {
    // eslint-disable-next-line react/no-unused-state
    this.setState({ isLoading: true, progress: 0 });

    try {
      // eslint-disable-next-line no-console
      console.log("Starting retrieveModels...");

      // Fetch models from the API
      const response = await fetch("/models");
      if (!response.ok) {
        throw new Error(`Error fetching models: ${response.statusText}`);
      }

      const models = await response.json();
      // eslint-disable-next-line no-console
      console.log("Fetched models:", models);

      if (!Array.isArray(models)) {
        throw new Error("Invalid models data: Expected an array.");
      }

      // Transform models into nodes and relationships
      const nodes = models.map(model => ({
        id: model.id,
        label: model.name || model.id
      }));

      const relationships = models.flatMap(
        model =>
          model.relationships?.map(rel => ({
            sourceId: model.id,
            targetId: rel.target,
            relationshipName: rel.name
          })) || []
      );

      // eslint-disable-next-line no-console
      console.log("Nodes:", nodes);
      // eslint-disable-next-line no-console
      console.log("Relationships:", relationships);

      // Update the graph
      if (this.cyRef.current) {
        // eslint-disable-next-line line-comment-position, no-inline-comments
        this.cyRef.current.clearNodes(); // Clear existing nodes
        // eslint-disable-next-line line-comment-position, no-inline-comments
        this.cyRef.current.addNodes(nodes); // Add new nodes
        // eslint-disable-next-line line-comment-position, no-inline-comments
        this.cyRef.current.addRelationships(relationships, "related"); // Add relationships
        // eslint-disable-next-line line-comment-position, no-inline-comments
        await this.cyRef.current.doLayout(); // Perform layout
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error in retrieveModels:", err);
      eventService.publishError(err);
    } finally {
      // eslint-disable-next-line react/no-unused-state
      this.setState({ isLoading: false, progress: 100 });
      // eslint-disable-next-line no-console
      console.log("Finished retrieveModels.");
    }
  }

  // Highlight nodes (e.g., on selection)
  highlightNodes = nodeId => {
    if (this.cyRef.current) {
      this.cyRef.current.clearHighlighting();
      this.cyRef.current.highlightNodes([ { id: nodeId } ], true);
    }
  };

  // Clear highlights
  clearHighlights = () => {
    if (this.cyRef.current) {
      this.cyRef.current.clearHighlighting();
    }
  };

  // Lifecycle method
  async componentDidMount() {
    // Initialize the component
    await this.initialize();
  }

  render() {
    const { isLoading } = this.state;

    return (
      <div className="mgv-wrap">
        <div className="model-graph">
          {/* Pass the ref to the Cytoscape component */}
          <ModelGraphViewerCytoscapeComponent ref={this.cyRef} />
        </div>
        {isLoading && <LoaderComponent />}
      </div>
    );
  }

}

export default ModelGraphViewerComponent;
