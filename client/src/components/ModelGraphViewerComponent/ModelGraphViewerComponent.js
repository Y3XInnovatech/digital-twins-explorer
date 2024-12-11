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
      layout: "d3Force"
    };
    this.cyRef = React.createRef();
  }

  // eslint-disable-next-line require-await
  async componentDidMount() {
    // Ensure the component is fully initialized before retrieving models
    setTimeout(async () => {
      await this.retrieveModels();
    }, 100);

    // Subscribe to model updates
    eventService.subscribeModelsUpdate(() => {
      this.retrieveModels();
    });
  }

  async retrieveModels() {
    this.setState({ isLoading: true });

    try {
      // eslint-disable-next-line no-console
      console.log("Starting retrieveModels...");

      // Fetch models from the API
      const response = await fetch("/models");
      // eslint-disable-next-line no-console
      console.log("Fetch response:", response);

      if (!response.ok) {
        throw new Error(`Error fetching models: ${response.statusText}`);
      }

      const models = await response.json();
      // eslint-disable-next-line no-console
      console.log("Fetched models:", models);

      // Validate and transform models into nodes and relationships
      if (!Array.isArray(models)) {
        throw new Error("Invalid models data: Expected an array.");
      }

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

      // Ensure cyRef.current is initialized before using it
      if (this.cyRef.current) {
        // eslint-disable-next-line no-console
        console.log("cyRef.current is initialized:", this.cyRef.current);

        // Add nodes and relationships to the graph
        this.cyRef.current.addNodes(nodes);
        this.cyRef.current.addRelationships(relationships, "related");

        // Perform layout
        await this.cyRef.current.doLayout();
      } else {
        // eslint-disable-next-line no-console
        console.warn("cyRef.current is not initialized.");
      }
    } catch (err) {
      // Log and publish errors
      // eslint-disable-next-line no-console
      console.error("Error in retrieveModels:", err);
      eventService.publishError(err);
    } finally {
      this.setState({ isLoading: false });
      // eslint-disable-next-line no-console
      console.log("Finished retrieveModels.");
    }
  }

  render() {
    const { isLoading } = this.state;

    return (
      <div className="mgv-wrap">
        <div className="model-graph">
          {/* Ensure the ref is passed correctly */}
          <ModelGraphViewerCytoscapeComponent ref={this.cyRef} />
        </div>
        {isLoading && <LoaderComponent />}
      </div>
    );
  }

}

export default ModelGraphViewerComponent;
