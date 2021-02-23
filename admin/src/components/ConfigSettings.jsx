import React from "react";
import { withStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
import ConfigList from "./ConfigList";
import AdapterList from "./AdapterList";
import { styles, AddTooltip, IButton, TButton, ScrollTop, UButton } from "./UiComponents";
//import ChipInput from "material-ui-chip-input";
import { Iob, t, logSnackbar } from "./Iob";
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
} from "@material-ui/core";

import configtool from "../../assets/config.json";
//import { config } from "chai";
//import { isNoSubstitutionTemplateLiteral } from "typescript";
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
      const tab = state.tab || 0;
      newState = {
        config,
        configPage: props.configPage,
        page: config[tab] || [],
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
              ["label", "tooltip", "placeholder", "hint", "text", "html"].indexOf(name) >= 0 &&
              typeof other[name] === "string"
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

  renderToolbarAdapter() {
    const {
      instanceConfig,
      displayLanguage,
      adapterInstance,
      adapterStatus,
      configPage,
    } = this.props;
    let readme = (instanceConfig && instanceConfig.common && instanceConfig.common.readme) || "#";
    const lang = displayLanguage;
    if (lang != "en")
      readme = `https://translate.google.com/translate?sl=auto&tl=${lang}&u=${encodeURIComponent(
        readme
      )}`;

    return (
      <React.Fragment>
        <Paper elevation={0} variant="outlined">
          <Avatar src={"./" + configPage.iconName || instanceConfig.common.icon} variant="square" />
        </Paper>
        <Typography variant="h6" color="inherit">
          &nbsp;&nbsp;{adapterInstance}&nbsp;
        </Typography>
        <Typography variant="subtitle2" color="inherit">
          &nbsp;v{instanceConfig.common.version}&nbsp;&nbsp;
        </Typography>
        {AddTooltip(
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
        <IButton
          tooltip={!adapterStatus.status ? t("start adapter") : t("stop adapter")}
          style={{
            margin: "0px 10px",
            color: !adapterStatus.alive ? "red" : adapterStatus.connected ? "green" : "orange",
          }}
          onClick={(e) => Iob.enableDisableAdapter(!adapterStatus.alive)}
          icon={!adapterStatus.status ? "play_circle" : "pause_circle"}
          size="large"
        />
        <IButton
          disabled={!adapterStatus.alive}
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
    const {
      inative,
      adapterInstance,
      displayLanguage,
      narrowWidth,
      inativeChanged,
      classes,
    } = this.props;
    return (
      <React.Fragment>
        <TButton
          tooltip={t("backupConfig")}
          endIcon="save_alt"
          color="inherit"
          size="large"
          onClick={(e) =>
            Iob.saveFile(
              { native: inative },
              {
                stringify: true,
                name:
                  adapterInstance +
                  "_config_" +
                  new Date()
                    .toLocaleDateString(displayLanguage, {
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
          narrow={narrowWidth}
          //          label={t("ra_Save Config")}
        />
        <UButton
          tooltip={t("restoreConfig")}
          endIcon="system_update_alt"
          color="inherit"
          size="large"
          dropStyle={{ color: "darkred" }}
          dropLabel={t("drop single file")}
          receivedFile={(value, file) => {
            //            Iob.logSnackbar("info;file loaded: {0}", file.path);
            let native = null;
            debugger;
            try {
              native = JSON.parse(value);
            } catch (e) {
              Iob - logSnackbar("error;cannotParseNative", e);
            }
            if (native && native.native) {
              Iob.setStore.setInative(native.native);
              Iob.logSnackbar("success;config file loaded: {0}", file);
            } else Iob.logSnackbar("error;cannotParseNative", file);
          }}
          narrow={narrowWidth}
        />
        <TButton
          tooltip={t("rt_Saveconfig")}
          disabled={!inativeChanged}
          endIcon="save"
          size="large"
          color="inherit"
          onClick={() => Iob.configSave(false)}
          narrow={narrowWidth}
          label={t("ra_Save")}
        />
        <TButton
          tooltip={t("ttSaveClose")}
          disabled={!inativeChanged}
          endIcon="settings_power"
          size="large"
          color="inherit"
          onClick={() => Iob.configSave(true)}
          narrow={narrowWidth}
          label={t("raSaveclose")}
        />
        <TButton
          tooltip={t("Cancel & Close")}
          color="inherit"
          size="large"
          className={classes.menuButton}
          endIcon="close"
          onClick={() => Iob.onClose()}
          narrow={narrowWidth}
          label={t("ra_cancel")}
        />
      </React.Fragment>
    );
  }
  render() {
    const { tab, page, config } = this.state;
    //    console.log(tab, page);
    if (!page || !page.items) return null;
    const { inative } = this.props;
    let ti = 0;
    const pi = [];
    return (
      //      <div className={this.props.classes.tab}>
      <React.Fragment>
        <AppBar position="sticky" style={{ position: "fixed !important" }}>
          <Toolbar variant="dense">
            {this.renderToolbarAdapter()}
            <div style={{ flexGrow: 1 }} />
            <Tabs
              value={tab}
              onChange={(e, t) => {
                //                console.log(e, t);
                this.setState({ tab: t, page: this.state.config[pi[t]] });
              }}
              textColor="inherit"
              centered
            >
              {config.map((p, i) => {
                const { icon, label, hideItem, tooltip } = p;
                const key = `tab${i}`;
                if (typeof hideItem === "string")
                  try {
                    const fun = Iob.makeFunction(hideItem, this, "props", "Iob");
                    const res = fun(this.props, Iob);
                    //          console.log("hideItem", key, hideItem, res);
                    if (res) return null;
                  } catch (e) {
                    Iob.logSnackbar("error; error in 'hideItem' for " + key + ":" + e);
                  }
                else if (typeof hideItem === "boolean" && hideItem) return null;
                else if (typeof hideItem === "function" && hideItem(this.props, Iob)) return null;
                const index = ti++;
                pi[index] = i;
                const tab = (
                  <Tab
                    key={key}
                    icon={icon ? <Icon>{icon}</Icon> : null}
                    label={label}
                    value={index}
                  />
                );
                return AddTooltip(tooltip, tab, key);
              })}
            </Tabs>
            <div style={{ flexGrow: 1 }} />
            {this.renderConfigSave()}
          </Toolbar>
        </AppBar>
        <ScrollTop />
        {page.label === "Adapters" ? (
          <AdapterList page={page} tab={tab} />
        ) : (
          <ConfigList
            page={page}
            inative={inative}
            index={tab.toString()}
            attr={""}
            onUpdateValue={(attr, value) => Iob.updateInativeValue(inative, attr, value)}
          />
        )}
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
