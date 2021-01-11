import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
import ConfigItem from "./ConfigItem";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
import { Iob, styles, t, splitProps, isPartOf } from "./Iob";
import {
  Avatar,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Icon,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Divider,
  CssBaseline,
} from "@material-ui/core";
import { config } from "chai";
//import { isNotEmittedStatement } from "typescript";

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
    //    console.log("config:", config);
    const conf = (config && config.configTool) || [];
    const res = translateConfig(conf).map((p) => {
      let { spacing, ...other } = p;
      if (!spacing) other.spacing = 2;
      return { ...other };
    });
    return res ? res : [];
  }

  handleTabChange(e, t) {
    //    console.log(e, t);
    this.setState({ tab: t, page: this.state.config[t] });
  }

  renderToolbarAdapter() {
    return (
      <>
        <Paper elevation={0} variant="outlined">
          <Avatar src="./reacttestr.png" variant="square" />
        </Paper>
        <Typography variant="h6" color="inherit">
          &nbsp;&nbsp;{this.props.adapterName}.{this.props.instance}&nbsp;
        </Typography>
        <Typography variant="subtitle2" color="inherit">
          &nbsp;v{this.props.instanceConfig.common.version}&nbsp;&nbsp;
        </Typography>
        {Iob.AddTooltip(
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
        <Iob.TButton
          tooltip="Save config to file"
          icon="save_alt"
          onClick={() => this.props.app.onSave(false)}
          narrow={this.props.narrowWidth}
          label="ra_Save Config"
        />
        <Iob.TButton
          tooltip="Load config from file"
          icon="system_update_alt"
          onClick={() => this.props.app.onSave(false)}
          narrow={this.props.narrowWidth}
          label="ra_Load Config"
        />
        <Iob.TButton
          tooltip="Save config"
          disabled={!this.props.changed}
          icon="save"
          onClick={() => this.props.app.onSave(false)}
          narrow={this.props.narrowWidth}
          label="ra_Save"
        />
        <Iob.TButton
          tooltip="Save & Close"
          disabled={!this.props.changed}
          icon="settings_power"
          onClick={() => this.props.app.onSave(true)}
          narrow={this.props.narrowWidth}
          label="ra_Save and close"
        />
        <Iob.TButton
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
      //      <div className={this.props.classes.tab}>
      <React.Fragment>
        <CssBaseline />
        <AppBar position="sticky" style={{ position: "fixed !important" }}>
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
                return Iob.AddTooltip(p.tooltip, tab, key);
              })}
            </Tabs>
            <div style={{ flexGrow: 1 }} />
            {this.renderConfigSave()}
          </Toolbar>
        </AppBar>
        <Iob.ScrollTop />

        <Container maxWidth={false} disableGutters>
          <Paper elevation={2} style={{ padding: "4px 4px", margin: "3px 3px" }}>
            <Grid
              container
              spacing={this.state.page.spacing || 2}
              style={{ paddingTop: "4px", paddingBottom: "16px" }}
            >
              {this.state.page.items.map((item, index) => {
                const { cols, noGrid, ...rest } = item;
                const { items, split } = splitProps(rest, "xs|xl|sm|md|lg");
                if (!split.sm && cols) split.sm = cols;
                if (!split.sm) split.sm = 2;
                const key = `${this.state.tab}/${index}/${items.itype}`;
                let configItem;
                switch (rest.itype) {
                  case "divider":
                    return (
                      <Grid item sm={12} key={key + "d"}>
                        <Divider variant="fullWidth" />
                      </Grid>
                    );
                  case "vdivider":
                    return <Divider key={key + "v"} orientation="vertical" flexItem></Divider>;
                  default:
                    configItem = (
                      <ConfigItem
                        key={key + "C"}
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
                    return noGrid ? (
                      configItem
                    ) : (
                      <Grid item {...split} key={key}>
                        {configItem}
                      </Grid>
                    );
                }
              })}
            </Grid>
          </Paper>
        </Container>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(
  Iob.connect((state) => {
    const { ...all } = state;
    return { ...all };
  })(ConfigSettings)
);
