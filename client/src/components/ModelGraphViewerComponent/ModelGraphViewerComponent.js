// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

import {
  ModelGraphViewerCytoscapeComponent,
  ModelGraphViewerCytoscapeLayouts,
} from "./ModelGraphViewerCytoscapeComponent/ModelGraphViewerCytoscapeComponent";
import ModelGraphViewerFilteringComponent from "./ModelGraphViewerFilteringComponent/ModelGraphViewerFilteringComponent";
import ModelGraphViewerRelationshipsToggle from "./ModelGraphViewerRelationshipsToggle/ModelGraphViewerRelationshipsToggle";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { eventService } from "../../services/EventService";
import { withTranslation } from "react-i18next";
import "./ModelGraphViewerComponent.scss";
import { ModelGraphViewerModelDetailComponent } from "./ModelGraphViewerModelDetailComponent/ModelGraphViewerModelDetailComponent";
import { Icon } from "office-ui-fabric-react";
import { DETAIL_MIN_WIDTH } from "../../services/Constants";
import ModelGraphViewerCommandBarComponent from "./ModelGraphViewerCommandBarComponent/ModelGraphViewerCommandBarComponent";


class ModelGraphViewerComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      isLoading: false,
      filterIsOpen: false,
      modelDetailIsOpen: false,
      showRelationships: true,
      showInheritances: true,
      showComponents: true,
      highlightingTerms: [],
      filteringTerms: [],
      modelDetailWidth: DETAIL_MIN_WIDTH,
      layout: "d3Force",
      selectedModel: null,
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

      eventService.subscribeSelectModel((item) => {
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
    this.setState({ isLoading: true, progress: 0 });

    try {
      const response = await fetch("/models");
      if (!response.ok) {
        throw new Error(`Error fetching models: ${response.statusText}`);
      }

      const models = await response.json();

      if (!Array.isArray(models)) {
        throw new Error("Invalid models data: Expected an array.");
      }

      // Transform models into nodes
      const nodes = models.map((model) => ({
        id: model.id,
        displayName: model.displayName.en || model.id, // Use displayName if available
      }));

      // Parse regular relationships
      const relationships = models.flatMap(
        (model) =>
          model.model.contents
            ?.filter((content) => content["@type"] === "Relationship")
            .map((rel) => ({
              sourceId: model.id,
              targetId: rel.target,
              relationshipName: rel.name,
              type: "relationship", // Mark as a regular relationship
            })) || []
      );

      // Parse inheritance relationships (extends)
      const inheritanceRelationships = models.flatMap(
        (model) =>
          model.model.extends?.map((baseModel) => ({
            sourceId: model.id,
            targetId: baseModel,
            relationshipName: "extends",
            type: "inheritance", // Mark as an inheritance relationship
          })) || []
      );

      // Combine both types of relationships
      const allRelationships = [...relationships, ...inheritanceRelationships];

      if (this.cyRef.current) {
        this.cyRef.current.clearNodes();
        this.cyRef.current.addNodes(nodes);
        this.cyRef.current.addRelationships(allRelationships, "related");
        await this.cyRef.current.doLayout();
      }
    } catch (err) {
      console.error("Error in retrieveModels:", err);
      eventService.publishError(err);
    } finally {
      this.setState({ isLoading: false, progress: 100 });
    }
  }

  // Highlight nodes (e.g., on selection)
  highlightNodes = (nodeId) => {
    if (this.cyRef.current) {
      this.cyRef.current.clearHighlighting();
      this.cyRef.current.highlightNodes([{ id: nodeId }], true);
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
    const {
      isLoading,
      progress,
      filterIsOpen,
      showRelationships,
      showInheritances,
      showComponents,
      highlightingTerms,
      modelDetailIsOpen,
      modelDetailWidth,
      filteringTerms,
      layout,
    } = this.state;

    return (
      <div
        className={`mgv-wrap ${modelDetailIsOpen ? "md-open" : "md-closed"}`}
      >
        <div
          className={`model-graph gc-grid ${filterIsOpen ? "open" : "closed"}`}
        >
          <div className="gc-wrap">
            <ModelGraphViewerRelationshipsToggle
              setFirstItemRef={(ref) => (this.relationshipsToggle = ref)}
              onKeyDown={() => null}
              onRelationshipsToggleChange={this.onRelationshipsToggleChange}
              onInheritancesToggleChange={this.onInheritancesToggleChange}
              onComponentsToggleChange={this.onComponentsToggleChange}
              showRelationships={showRelationships}
              showInheritances={showInheritances}
              showComponents={showComponents}
            />
            <div className="gc-toolbar">
              <ModelGraphViewerCommandBarComponent
                className="gc-commandbar"
                buttonClass="gc-toolbarButtons"
                layouts={Object.keys(ModelGraphViewerCytoscapeLayouts)}
                layout={layout}
                onLayoutChanged={this.onLayoutChanged}
              />
            </div>
            <ModelGraphViewerCytoscapeComponent
              onNodeClicked={this.onNodeClicked}
              layout={layout}
              onControlClicked={this.onControlClicked}
              onNodeMouseEnter={this.onNodeMouseEnter}
              onEdgeMouseEnter={this.onEdgeMouseEnter}
              isHighlighting={highlightingTerms && highlightingTerms.length > 0}
              highlightFilteredNodes={this.highlightFilteredNodes}
              ref={this.cyRef}
            />
          </div>
          <div className="gc-filter">
            <ModelGraphViewerFilteringComponent
              toggleFilter={this.toggleFilter}
              onZoomIn={this.onZoomIn}
              onZoomOut={this.onZoomOut}
              onZoomToFit={this.onZoomToFit}
              onAddHighlightingTerm={this.onAddHighlightingTerm}
              onRemoveHighlightingTerm={this.onRemoveHighlightingTerm}
              onAddFilteringTerm={this.onAddFilteringTerm}
              onRemoveFilteringTerm={this.onRemoveFilteringTerm}
              onUpdateFilteringTerm={this.onUpdateFilteringTerm}
              onUpdateHighlightingTerm={this.onUpdateHighlightingTerm}
              highlightingTerms={highlightingTerms}
              filteringTerms={filteringTerms}
              onSwitchFilters={this.onSwitchFilters}
            />
          </div>
          {isLoading && (
            <LoaderComponent message={`${Math.round(progress)}%`} />
          )}
        </div>
        <div
          className="model-detail"
          style={{ width: modelDetailIsOpen ? `${modelDetailWidth}%` : 0 }}
        >
          <div
            className="detail-toggle"
            onClick={this.toggleModelDetail}
            tabIndex="0"
            onKeyDown={this.handleToggleModelDetailOnEnter}
          >
            <Icon
              className="toggle-icon"
              iconName={
                modelDetailIsOpen ? "DoubleChevronRight" : "DoubleChevronLeft"
              }
              aria-label={this.props.t("modelGraphViewerComponent.toggleIcon")}
              role="button"
              title="Expand/Collapse"
            />
          </div>
          <ModelGraphViewerModelDetailComponent ref={this.modelDetail} />
          {modelDetailIsOpen && (
            <div className="dragable" onMouseDown={this.handleMouseDown} />
          )}
        </div>
      </div>
    );
  }
}

export default withTranslation("translation", { withRef: true })(
  ModelGraphViewerComponent
);
