import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
import ConfigItem from "./ConfigItem";
import { withSnackbar } from "notistack";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
import { Components, styles, t, splitProps, isPartOf } from "./Components";
import {
  Avatar,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Icon,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Divider,
} from "@material-ui/core";
import { bindActionCreators } from "redux";
import { ioBroker } from "../rtk/reducers";
import { config } from "chai";
import { isNotEmittedStatement } from "typescript";

/**
 * @typedef {object} SettingsProps
 * @property {Record<string, string>} classes
 * @property {Record<string, any>} inative
 * @property {(field: string, value: any) => void} onChange
 */

/**
 * @typedef {object} SettingsState
 * @property {undefined} [dummy] Delete this and add your own state properties here
 */

/**
 * @extends {React.Component<SettingsProps, SettingsState>}
 */
class ConfigSettings extends React.Component {
  constructor(props) {
    super(props);
    this.oConfig = props.configPage;
    this.classes = props.classes;
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
    this.state = {
      tab: 0,
      config: [[]],
      page: [{ no_page: "No Page" }],
    };
  }

  static getDerivedStateFromProps(props, state) {
    let newState = null;
    //    console.log("derivedState:", state.opvalue, props.value, state.value);
    if (props.configPage !== state.configPage) {
      //      console.log("Prop value changed!", state.opvalue, props.value, state.value);
      const config = ConfigSettings.transformConfig(props.configPage);
      newState = {
        config,
        configPage: props.configPage,
        page: config[0] || [],
      };
    }
    return newState;
  }

  static transformConfig(config) {
    function translateConfig(arr) {
      const ret = arr.map((item) => {
        const { items, ...other } = item;
        const tnew = {};
        const res = Object.keys(other).map(
          (name) =>
            (tnew[name] =
              ["label", "tooltip", "placeholder", "hint", "text", "html"].indexOf(name) >= 0
                ? t(other[name])
                : other[name])
        );
        if (items) tnew.items = translateConfig(items);
        return tnew;
      });
      return ret;
    }
    console.log("config:", config);
    const conf = (config && config.configTool) || [];
    const res = translateConfig(conf).map((p) => {
      let { spacing, ...other } = p;
      if (!spacing) other.spacing = 2;
      return { ...other };
    });
    return res ? res : [];
  }

  handleTabChange(e, t) {
    console.log(e, t);
    this.setState({ tab: t, page: this.state.config[t] });
  }

  renderToolbarAdapter() {
    return (
      <>
        <Paper elevation={0} variant="outlined">
          <Avatar src="./reacttest.png" variant="square" />
        </Paper>
        <Typography variant="h6" color="inherit">
          &nbsp;&nbsp;{this.props.adapterName}.{this.props.instance}&nbsp;
        </Typography>
        <Typography variant="subtitle2" color="inherit">
          &nbsp;v{this.props.instanceConfig.common.version}&nbsp;&nbsp;
        </Typography>
        {Components.AddTooltip(
          t("Open Readme"),
          <IconButton
            edge="start"
            className={this.classes.menuButton}
            color="inherit"
            aria-label="menu"
            href={(this.props.instanceConfig && this.props.instanceConfig.common.readme) || "#"}
            target="_"
          >
            <Icon color="inherit">help_outline</Icon>
          </IconButton>
        )}
      </>
    );
  }

  renderConfigSave() {
    return (
      <>
        <Components.TButton
          tooltip="Save config to file"
          icon="save_alt"
          onClick={() => this.props.app.onSave(false)}
          narrow={this.props.narrowWidth}
          label="ra_Save Config"
        />
        <Components.TButton
          tooltip="Load config from file"
          icon="system_update_alt"
          onClick={() => this.props.app.onSave(false)}
          narrow={this.props.narrowWidth}
          label="ra_Load Config"
        />
        <Components.TButton
          tooltip="Save config"
          disabled={!this.props.changed}
          icon="save"
          onClick={() => this.props.app.onSave(false)}
          narrow={this.props.narrowWidth}
          label="ra_Save"
        />
        <Components.TButton
          tooltip="Save & Close"
          disabled={!this.props.changed}
          icon="settings_power"
          onClick={() => this.props.app.onSave(true)}
          narrow={this.props.narrowWidth}
          label="ra_Save and close"
        />
        <Components.TButton
          tooltip="Cancel & Close"
          color="inherit"
          className={this.props.classes.menuButton}
          icon="close"
          onClick={() => this.props.app.onClose()}
          narrow={this.props.narrowWidth}
          label="ra_Close"
        />
      </>
    );
  }

  render() {
    if (!this.state.page || !this.state.page.items || !this.state.page.items.length) return null;
    return (
      <div className={this.props.classes.tab}>
        <AppBar position="static">
          <Toolbar variant="dense">
            {this.renderToolbarAdapter()}
            <div style={{ flexGrow: 1 }} />
            <Tabs
              value={this.state.tab}
              onChange={(e, t) => this.handleTabChange(e, t)}
              textColor="inherit"
              centered
            >
              {this.state.config.map((p, index) => {
                const key = `tab${index}`;
                const tab = (
                  <Tab
                    key={key}
                    icon={p.icon ? <Icon>{p.icon}</Icon> : null}
                    label={p.label}
                    value={index}
                  />
                );
                return Components.AddTooltip(p.tooltip, tab, key);
              })}
            </Tabs>
            <div style={{ flexGrow: 1 }} />
            {this.renderConfigSave()}
          </Toolbar>
        </AppBar>
        <Paper elevation={2} style={{ padding: "4px 4px", margin: "3px 3px" }}>
          <Grid container spacing={this.state.page.spacing || 2}>
            {this.state.page.items.map((item, index) => {
              const { cols, ...rest } = item;
              const isdivider = isPartOf(rest.itype, "divider|vdivider");
              const { items, split } = splitProps(rest, "xs|xl|sm|md|lg|noGrid");
              if (!split.sm && cols) split.sm = cols;
              if (!split.sm) split.sm = 3;
              const noGrid = split.noGrid;
              delete split.noGrid;
              const key = `${this.state.tab}/${index}/${items.itype}`;
              const configItem = (
                <ConfigItem
                  key={key}
                  item={items}
                  index={key}
                  native={this.props.inative}
                  app={this.props.app}
                  attr={item.field}
                  field={item.field}
                  value={this.props.inative[item.field]}
                  settings={this}
                  itype={items.itype}
                />
              );
              return isdivider ? (
                rest.itype == "divider" ? (
                  <Grid item xs={12} key={key + "d"}>
                    <Divider variant="fullWidth" />
                  </Grid>
                ) : (
                  <Divider key={key + "v"} orientation="vertical" flexItem></Divider>
                )
              ) : noGrid ? (
                configItem
              ) : (
                <Grid item {...split} key={key}>
                  {configItem}
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </div>
    );
  }
}

export default withStyles(styles)(
  withSnackbar(
    connect(
      (state) => {
        const { ...all } = state;
        return { ...all };
      },
      (dispatch) => ({
        ...bindActionCreators(ioBroker.actions, dispatch),
      })
    )(ConfigSettings)
  )
);
