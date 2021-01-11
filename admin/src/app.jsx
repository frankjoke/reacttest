import React from "react";
import { withStyles } from "@material-ui/core/styles";
//import "@babel/polyfill";
import GenericApp from "@iobroker/adapter-react/GenericApp";
import ConfigSettings from "./Components/ConfigSettings";
//import { isThrowStatement } from "typescript";
import ConfigFixed from "../assets/config.json";
import { config } from "chai";
import Iob from "./components/Iob";

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
    this.logs = [];
    this.adapterLogTimeout = null;
    Iob.setStore.setAdapterName(props.adapterName);
    Iob.setStore.setadapterInstance(this.instanceId.split(".").slice(2).join("."));
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
    //    console.log(this.instance, this.instanceId, this, this.socket);
    const logHandler = (message) => {
      //      console.log("logHandler", message);
      this.logs.push(message);
      if (this.logs.length == 1 && !this.adapterLogTimeout)
        this.adapterLogTimeout = setTimeout(() => {
          this.adapterLogTimeout = null;
          Iob.setStore.updateAdapterLog(this.logs);
          this.logs = [];
        }, 100);
    };
    this.socket.registerLogHandler(logHandler);
    this.getSystemConfig()
      .then((sc) => {
        //        this.setState({ systemConfig: sc });
        Iob.setStore.setSystemConfig(sc);
        Iob.logSnackbar("success;SystemConfig loaded");
      })
      .catch((e) => {
        console.log("catch SystemConfig:", e);
        Iob.logSnackbar("error;system config not loaded %s", e);
      })
      .then(() =>
        this.socket
          .getObject(this.instanceId)
          .then((i) => {
            //        this.setState({ instanceConfig: i });
            Iob.setStore.setInstanceConfig(i);
            Iob.logSnackbar("success;instanceConfig loaded");
            if (i.native) {
              Iob.setStore.setInative(i.native);
              Iob.logSnackbar("success;inative loaded");
            } else Iob.logSnackbar("error;inative not loaded %s", e);
          })
          .catch((e) => {
            console.log("catch InstanceConfig:", e);
            Iob.logSnackbar("error;loading instance config: %s", e);
          })
      )
      .then(() =>
        this.getIpAddresses()
          .then((r) => {
            //            this.setState({ ipAddresses: r });
            Iob.setStore.setIpAddresses(r);
            Iob.logSnackbar("success;IpAddresses loaded");
          })
          .catch((e) => {
            console.log("catch IpAddresses:", e);
            Iob.logSnackbar("error;ipAddress not loaded %s", e);
          })
      )
      .then(() => this.loadJson("config.json"))
      .then(
        (r) => {
          if (!r) r = ConfigFixed;
          //        this.setState({ configPage: r });
          Iob.setStore.setConfigPage(r);
          Iob.logSnackbar("success;config.json loaded");
        },
        (e) => {
          console.log("catch config.json:", e);
          Iob.logSnackbar("error;config.json not loaded %s", e);
        }
      );
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

export default withStyles((_theme) => ({
  root: {},
}))(
  Iob.connect((state) => {
    const { ...all } = state;
    return { ...all };
  })(App)
);
