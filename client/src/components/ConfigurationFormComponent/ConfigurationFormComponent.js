// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import {
  TextField,
  DefaultButton,
  PrimaryButton,
  FocusZone,
  FocusZoneTabbableElements,
  Dropdown
} from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";
import { settingsService } from "../../services/SettingsService";
import { configService } from "../../services/ConfigService";

import "./ConfigurationFormComponent.scss";
import dotenv from "dotenv";
dotenv.config();

const USE_LOCAL_MODELS = process.env.REACT_APP_USE_LOCAL_MODELS === "true";

export class ConfigurationFormComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      appAdtUrl: "",
      environmentOptions: [],
      isEnvironmentSelected: false
    };
    this.environments = settingsService.environments;
  }

  async componentDidMount() {
    if (USE_LOCAL_MODELS) {
      // eslint-disable-next-line no-console
      console.log(
        "Local models mode enabled. Skipping Azure Digital Twins URL configuration."
      );
      return;
    }

    eventService.subscribeConfigure(evt => {
      this.loadConfigurationSettings(evt);
    });

    if (this.environments) {
      this.setState({
        environmentOptions: this.environments.map(env => env.name)
      });
    }

    let config = {};
    try {
      config = await configService.getConfig();
    } catch (exc) {
      config = {};
    }

    if (config.appAdtUrl) {
      this.setState({ isEnvironmentSelected: true });
    }
  }

  loadConfigurationSettings = evt => {
    if (!USE_LOCAL_MODELS && evt.type === "start") {
      this.setState({ showModal: true, appAdtUrl: evt.appAdtUrl });
    }
  };

  saveConfigurationsSettings = e => {
    e.preventDefault();
    if (USE_LOCAL_MODELS) {
      // eslint-disable-next-line no-console
      console.log("Local models mode enabled. Skipping saving configuration.");
      this.resetModalState();
      return;
    }

    const config = {
      appAdtUrl: this.state.appAdtUrl
    };

    if (this.validateConfig(config)) {
      this.saveEnvironment(config);
      configService.setConfig(config);
      eventService.publishConfigure({ type: "end", config });
      this.resetModalState();
    }
  };

  validateConfig = config => {
    if (USE_LOCAL_MODELS) {
      return true;
    }

    if (!config.appAdtUrl) {
      eventService.publishError({
        customMessage: "All fields are required."
      });
      return false;
    }

    if (!config.appAdtUrl.startsWith("https")) {
      eventService.publishError({
        customMessage: "Azure Digital Twins URL must start with ‘https’."
      });
      return false;
    }

    const regexp
      = /^(https):\/\/[\w-]+.api.[\w-.]+.[\w-.]+digitaltwins[\w-.]+/gm;
    if (!regexp.test(config.appAdtUrl)) {
      eventService.publishError({
        customMessage:
          "Azure Digital Twins URL must match the format 'https://<name>.api.<dc>.<domain>'."
      });
      return false;
    }

    return true;
  };

  resetModalState = () => {
    this.setState({
      showModal: false,
      appAdtUrl: ""
    });
  };

  render() {
    const { appAdtUrl, showModal, environmentOptions } = this.state;

    if (USE_LOCAL_MODELS) {
      return null;
    }

    return (
      <ModalComponent isVisible={showModal} className="configuration-settings">
        <FocusZone
          handleTabKey={FocusZoneTabbableElements.all}
          isCircularNavigation
          defaultActiveElement="#appClientIdField">
          <form onSubmit={this.saveConfigurationsSettings}>
            <h2 className="heading-2">
              {this.props.t("configurationFormComponent.heading")}
            </h2>
            <div className="select-settings">
              <Dropdown
                placeholder="Selected Environment"
                options={environmentOptions
                  .filter(env => env !== appAdtUrl)
                  .map(env => ({ key: env, text: env }))}
                styles={{
                  dropdown: { width: "100%" }
                }} />
              <TextField
                autoFocus
                required
                id="appAdtUrlField"
                label={this.props.t(
                  "configurationFormComponent.appAdtUrlField"
                )}
                className="configuration-input"
                styles={this.getStyles}
                value={appAdtUrl}
                onChange={evt =>
                  this.setState({ appAdtUrl: evt.target.value })} />
            </div>
            <p>{this.props.t("configurationFormComponent.detail")}</p>
            <div className="btn-group">
              <PrimaryButton
                type="submit"
                className="modal-button save-button"
                onClick={this.saveConfigurationsSettings}>
                {this.props.t("configurationFormComponent.saveButton")}
              </PrimaryButton>
              {this.state.isEnvironmentSelected && (
                <DefaultButton
                  className="modal-button cancel-button"
                  onClick={this.closeConfigurationSettings}>
                  {this.props.t("configurationFormComponent.cancelButton")}
                </DefaultButton>
              )}
            </div>
          </form>
        </FocusZone>
      </ModalComponent>
    );
  }

}
