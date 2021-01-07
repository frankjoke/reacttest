import React from "react";
//import { createSelector } from '@reduxjs/toolkit';
import { withStyles } from "@material-ui/core/styles";
//import "@babel/polyfill";
import GenericApp from "@iobroker/adapter-react/GenericApp";
import ConfigSettings from "./Components/ConfigSettings";
//import { isThrowStatement } from "typescript";
import { useSnackbar } from "notistack";
import ConfigFixed from "../assets/config.json";
import { config } from "chai";
import { withSnackbar } from "notistack";
import Iob, {
  styles,
  t,
  splitProps,
  isPartOf,
  bindActionCreators,
  ioBroker,
  connect,
} from "./components/Iob";

class App extends GenericApp {
  constructor(props) {
    const extendedProps = {
      ...props,
      encryptedFields: [],
      translations: {
        en: require("./i18n/en.json"),
        de: require("./i18n/de.json"),
        ru: require("./i18n/ru.json"),
        pt: require("./i18n/pt.json"),
        nl: require("./i18n/nl.json"),
        fr: require("./i18n/fr.json"),
        it: require("./i18n/it.json"),
        es: require("./i18n/es.json"),
        pl: require("./i18n/pl.json"),
        "zh-cn": require("./i18n/zh-cn.json"),
      },
    };
    super(props, extendedProps);
    props.setAdapterName(props.adapterName);
    Iob.setSnackbarProvider(
      this.props.enqueueSnackbar.bind(this),
      this.props.closeSnackbar.bind(this)
    );
  }

  loadJson(file) {
    return fetch(file)
      .then(
        (r) => r.json(),
        (e) => {
          console.log(`loadJson error for ${file}:`, e);
          return null;
        }
      )
      .catch((e) => {
        console.log("Err:", e);
        return null;
      })
      .then((r) => {
//        if (r) console.log("Found", file, ":", r);
        return r;
      });
  }

  onConnectionReady() {
    // executed when connection is ready
    this.getSystemConfig()
      .then((sc) => {
        //        this.setState({ systemConfig: sc });
        this.props.setSystemConfig(sc);
        this.props.enqueueSnackbar("SystemConfig", { variant: "success" });
      })
      .catch((e) => console.log("catch SystemConfig:", e))
      .then(() =>
        this.socket
          .getObject(this.instanceId)
          .then((i) => {
            //        this.setState({ instanceConfig: i });
            this.props.setInstanceConfig(i);
            this.props.enqueueSnackbar("instanceConfig", { variant: "success" });
            if (i.native) {
              this.props.setInative(i.native);
              this.props.enqueueSnackbar("inative", { variant: "success" });
            }
          })
          .catch((e) => console.log("catch InstanceConfig:", e))
      )
      .then(() =>
        this.getIpAddresses()
          .then((r) => {
            //            this.setState({ ipAddresses: r });
            this.props.setIpAddresses(r);
            this.props.enqueueSnackbar("IpAddresses", { variant: "success" });
          })
          .catch((e) => console.log("catch IpAddresses:", e))
      )
      .then(() => this.loadJson("config.json"))
      .then(
        (r) => {
          if (!r) r = ConfigFixed;
          //        this.setState({ configPage: r });
          this.props.setConfigPage(r);
          this.props.enqueueSnackbar("configPage", { variant: "success" });
        },
        (e) => console.log("catch config.json:", e)
      );
  }

  showError(message) {
    this.props.enqueueSnackbar(message, { variant: "error", autoHideDuration: 15000 });
  }

  render() {
    if (!this.state.loaded) {
      return super.render();
    }

    return (
      <div className="App">
        <ConfigSettings
          narrowWidth={
            this.state.width === "xs" || this.state.width === "sm" || this.state.width === "md"
          }
          instance={this.instance}
          instanceId={this.instanceId}
          changed={this.props.inativeChanged}
          app={this}
          key={this.state.configPage}
        />
      </div>
    );
  }
}

console.log("ioBroker", ioBroker);

export default withStyles((_theme) => ({
  root: {},
}))(
  withSnackbar(
    connect(
      (state) => {
        const { ...all } = state;
        return { ...all };
      },
      (dispatch) => ({
        ...bindActionCreators(ioBroker.actions, dispatch),
      })
    )(App)
  )
);
