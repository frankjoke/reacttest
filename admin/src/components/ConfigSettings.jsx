import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
import ConfigItem from "./ConfigItem";
import { LoadButton } from "./LoadButton";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
import { Iob, styles, t, splitProps, isPartOf, logSnackbar } from "./Iob";
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
import { isNoSubstitutionTemplateLiteral } from "typescript";
//import { isNotEmittedStatement } from "typescript";

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
    let readme =
      (this.props.instanceConfig &&
        this.props.instanceConfig.common &&
        this.props.instanceConfig.common.readme) ||
      "#";
    const lang = Iob.getStore.displayLanguage;
    if (lang != "en")
      readme = `https://translate.google.com/translate?sl=auto&tl=${lang}&u=${encodeURIComponent(
        readme
      )}`;

    return (
      <React.Fragment>
        <Paper elevation={0} variant="outlined">
          <Avatar src={"./" + Iob.getStore.instanceConfig.common.icon} variant="square" />
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
            href={readme}
            target="_"
          >
            <Icon color="inherit">help_outline</Icon>
          </IconButton>
        )}
        <Iob.IButton
          tooltip={!this.props.adapterStatus.status ? t("start adapter") : t("stop adapter")}
          style={{
            margin: "0px 10px",
            color: !this.props.adapterStatus.alive
              ? "red"
              : this.props.adapterStatus.connected
              ? "green"
              : "orange",
          }}
          onClick={(e) => Iob.enableDisableAdapter(!this.props.adapterStatus.alive)}
          icon={!this.props.adapterStatus.status ? "play_circle" : "pause_circle"}
          size="large"
        />
        <Iob.IButton
          disabled={!this.props.adapterStatus.alive}
          tooltip={t("restart adapter")}
          style={{
            margin: "0px 10px",
          }}
          onClick={(e) => Iob.setLoglevel()}
          icon={"replay"}
        />
      </React.Fragment>
    );
  }

  renderConfigSave() {
    return (
      <React.Fragment>
        <Iob.TButton
          tooltip={t("backupConfig")}
          endIcon="save_alt"
          color="inherit"
          size="large"
          onClick={(e) =>
            Iob.saveFile(
              { native: this.props.inative },
              {
                stringify: true,
                name:
                  this.props.adapterInstance +
                  "_config_" +
                  new Date()
                    .toLocaleDateString(Iob.displayLanguage, {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                    .split(", ")
                    .join("-"),
              },
              e
            )
          }
          narrow={this.props.narrowWidth}
          //          label={t("ra_Save Config")}
        />
        <LoadButton
          tooltip={t("restoreConfig")}
          endIcon="system_update_alt"
          color="inherit"
          size="large"
          dropStyle={{ color: "darkred" }}
          dropLabel={t("drop single file")}
          receivedFile={(value, file) => {
//            Iob.logSnackbar("info;file loaded: %s", file.path);
            let native = null;
            debugger;
            try {
              native = JSON.parse(value);
            } catch(e) {
              Iob-logSnackbar("error;cannotParseNative", e);
            }
            if (native && native.native) {
              Iob.setStore.setInative(native.native);
              Iob.logSnackbar("success;config file loaded: %s", file);
            }
            else Iob.logSnackbar("error;cannotParseNative", file);
          }}
          narrow={this.props.narrowWidth}
        />
        <Iob.TButton
          tooltip={t("rt_Saveconfig")}
          disabled={!this.props.inativeChanged}
          endIcon="save"
          size="large"
          color="inherit"
          onClick={() => this.props.app.configSave(false)}
          narrow={this.props.narrowWidth}
          label={t("ra_Save")}
        />
        <Iob.TButton
          tooltip={t("Save & Close")}
          disabled={!this.props.inativeChanged}
          endIcon="settings_power"
          size="large"
          color="inherit"
          onClick={() => this.props.app.configSave(true)}
          narrow={this.props.narrowWidth}
          label={t("ra_Save and close")}
        />
        <Iob.TButton
          tooltip={t("Cancel & Close")}
          color="inherit"
          size="large"
          className={this.props.classes.menuButton}
          endIcon="close"
          onClick={() => this.props.app.onClose()}
          narrow={this.props.narrowWidth}
          label={t("ra_cancel")}
        />
      </React.Fragment>
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
                const { cols, noGrid, hideItem, ...rest } = item;
                const { items, split } = splitProps(rest, "xs|xl|sm|md|lg");
                if (!split.sm && cols) split.sm = cols;
                if (!split.sm) split.sm = 2;
                const key = `${this.state.tab}/${index}/${items.itype}`;
                if (typeof hideItem === "string") try {
                  const fun = Iob.makeFunction(hideItem, this, "props", "Iob");
                  const res = fun(this.props, Iob);
                  if (res) return null;
                } catch(e) {
                  Iob.logSnackbar("error; error in displayIf for {0}: {1}",key, e);
                } else if (typeof hideItem === "boolean" && hideItem) return null;
                let configItem;
                switch (rest.itype) {
                  case "$divider":
                    return (
                      <Grid item sm={12} key={key + "d"}>
                        <Divider variant="fullWidth" />
                      </Grid>
                    );
                  case "$vdivider":
                    return <Divider key={key + "v"} orientation="vertical" flexItem></Divider>;
                  default:
                    configItem = (
                      <ConfigItem
                        key={key + "C"}
                        item={items}
                        index={key}
                        inative={this.props.inative}
                        app={this.props.app}
                        attr={item.field || "$undefined"}
                        field={item.field }
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
