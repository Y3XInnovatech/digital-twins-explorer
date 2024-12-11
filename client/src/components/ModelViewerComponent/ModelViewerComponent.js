// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import {
  TextField,
  Selection,
  SelectionMode,
  SelectionZone
} from "office-ui-fabric-react";
import { withTranslation } from "react-i18next";

import ModelViewerCommandBarComponent from "./ModelViewerCommandBarComponent/ModelViewerCommandBarComponent";
import { ModelViewerViewComponent } from "./ModelViewerViewComponent/ModelViewerViewComponent";
import { ModelViewerCreateComponent } from "./ModelViewerCreateComponent/ModelViewerCreateComponent";
import { ModelViewerDeleteComponent } from "./ModelViewerDeleteComponent/ModelViewerDeleteComponent";
import { ModelViewerUpdateModelImageComponent } from "./ModelViewerUpdateModelImageComponent/ModelViewerUpdateModelImageComponent";
import LoaderComponent from "../LoaderComponent/LoaderComponent";
import { sortArray } from "../../utils/utilities";
import ModelViewerItem from "./ModelViewerItem/ModelViewerItem";
import { settingsService } from "../../services/SettingsService";
import { eventService } from "../../services/EventService";

import "./ModelViewerComponent.scss";

class ModelViewerComponent extends Component {

  constructor(props) {
    super(props);

    this.state = {
      items: [],
      filterText: "",
      isLoading: false,
      isUploadingModels: false
    };

    this.originalItems = [];
    this.modelViewerItems = [];
    this.lastFocusedItemIndex = null;
  }

  async componentDidMount() {
    eventService.subscribeDeleteModel(id => {
      if (id) {
        this.originalItems.splice(
          this.originalItems.findIndex(i => i.key === id),
          1
        );
        const items = this.originalItems;
        this.setState({ items, filterText: "" });
      }
    });

    eventService.subscribeCreateModel(() => {
      const { isUploadingModels } = this.state;
      if (!isUploadingModels) {
        this.retrieveModels();
      }
    });

    await this.retrieveModels();

    eventService.subscribeModelsUpdate(() => {
      this.retrieveModels();
    });
  }

  async retrieveModels() {
    this.setState({ isLoading: true, filterText: "" });

    try {
      const response = await fetch("/models");
      if (!response.ok) {
        throw new Error(`Error fetching models: ${response.statusText}`);
      }

      const list = await response.json();
      const items = list.map(m => ({
        displayName: m.name || m.id,
        key: m.id,
        selected: false
      }));

      sortArray(items, "displayName", "key");

      this.originalItems = items.slice(0, items.length);
      settingsService.setModelColors(items.map(item => item.key));
      this.setState({ items, isLoading: false });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error retrieving models:", err);
      eventService.publishError(err);
      this.setState({ isLoading: false });
    }
  }

  onFilterChanged = (_, text) => {
    this.setState({
      filterText: text,
      items: text
        ? this.originalItems.filter(item =>
          item.key.toLowerCase().includes(text.toLowerCase())
        )
        : this.originalItems
    });
  };

  render() {
    const { items, isLoading, filterText } = this.state;
    const { showItemMenu } = this.props;

    return (
      <>
        <div className="mv-grid">
          <div className="mv-toolbar">
            <ModelViewerCommandBarComponent
              className="mv-commandbar"
              buttonClass="mv-toolbarButtons"
              onDownloadModelsClicked={() => this.retrieveModels()} />
          </div>
          <div>
            <TextField
              className="mv-filter"
              onChange={this.onFilterChanged}
              placeholder={this.props.t(
                "modelViewerCommandBarComponent.searchPlaceholder"
              )}
              value={filterText} />
          </div>
          <div data-is-scrollable="true" className="mv-modelListWrapper">
            <SelectionZone
              selection={new Selection({ selectionMode: SelectionMode.single })}>
              {items.map((item, index) => (
                <ModelViewerItem
                  key={item.key}
                  item={item}
                  itemIndex={index}
                  isSelected={item.selected}
                  showItemMenu={showItemMenu}
                  setRef={ref => (this.modelViewerItems[index] = ref)} />
              ))}
            </SelectionZone>
          </div>
          {isLoading && <LoaderComponent />}
        </div>
        <ModelViewerViewComponent ref={this.viewRef} t={this.props.t} />
        <ModelViewerCreateComponent ref={this.createRef} t={this.props.t} />
        <ModelViewerDeleteComponent ref={this.deleteRef} t={this.props.t} />
        <ModelViewerUpdateModelImageComponent ref={this.updateModelImageRef} />
      </>
    );
  }

}

export default withTranslation()(ModelViewerComponent);
