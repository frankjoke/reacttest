import React from "react";
import { withStyles } from "@material-ui/core/styles";
//import "@babel/polyfill";
import GenericApp from "@iobroker/adapter-react/GenericApp";
import ConfigSettings from "./Components/ConfigSettings";
//import { isThrowStatement } from "typescript";
import ConfigFixed from "../assets/config.json";
import { config } from "chai";
import Iob from "./components/Iob";

const tpathname = window.location.pathname.split("/");
class App extends GenericApp {
  constructor(props) {
    const extendedProps = {
      ...props,
      adapterName:
        window.location.port == 1234
          ? "broadlink2"
          : props.adapterName || window.adapterName || tpathname[tpathname.length - 2] || "iot",
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
    this.storetimeouts = {};
    this.adapterLogTimeout = null;
    Iob.app = this;
    Iob.mergeTranslations(extendedProps.translations);
    Iob.setStore.setAdapterName((this.adapterName = extendedProps.adapterName));
    //    console.log(this.adapterName, extendedProps.adapterName);
    this.adapterInstance = this.adapterName + "." + this.instance;
    this.instanceID = "system.adapter." + this.adapterInstance;
    //    console.log(this.adapterName, this.instanceID);
    Iob.setStore.setAdapterInstance(this.adapterInstance);
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

  storeHandler(storeEntry, payload, time = 100) {
    if (!this.storetimeouts[storeEntry])
      this.storetimeouts[storeEntry] = { tmp: [], timeout: null };
    const stateEntry = this.storetimeouts[storeEntry];

    stateEntry.tmp.push(payload);
    if (stateEntry.tmp.length == 1 && !stateEntry.timeout)
      stateEntry.timeout = setTimeout(() => {
        stateEntry.timeout = null;
        const fun = Iob.setStore[storeEntry];
        //        console.log(storeEntry, fun, stateEntry.tmp);
        fun(stateEntry.tmp);
        stateEntry.tmp = [];
      }, time);
  }

  configSave(isClose) {
    let oldObj;
    this.socket
      .getObject(this.instanceId)
      .then((_oldObj) => {
        oldObj = _oldObj || { native: {} };
        const { inative } = this.props;
        for (const a in inative) {
          if (inative.hasOwnProperty(a)) oldObj.native[a] = inative[a];
        }
        /*
            if (this.state.common) {
                for (const b in this.state.common) {
                    if (this.state.common.hasOwnProperty(b)) {
                        oldObj.common[b] = this.state.common[b];
                    }
                }
            }
*/
        Iob.setStore.setInative(inative);
        this.onPrepareSave(oldObj.native);

        return this.socket.setObject(this.instanceId, oldObj);
      })
      .then(() => {
        this.savedNative = oldObj.native;
        this.setState({ changed: false });
        isClose && GenericApp.onClose();
      });
  }

  setInstanceConfig(i) {
    //        this.setState({ instanceConfig: i });
    const native = i.native;
    Iob.setStore.setInstanceConfig(i);
    Iob.logSnackbar("success;instanceConfig loaded");
    if (native) {
      this.onPrepareLoad(native);
      //      console.log(this.props.inative, native);
      Iob.setStore.setInative({ iNew: native, iOld: this.props.inative });
      Iob.logSnackbar("success;inative loaded");
    } else Iob.logSnackbar("error;inative not loaded %s", e);
  }

  onConnectionReady() {
    // executed when connection is ready
    //    console.log(this.instance, this.instanceId, this, this.socket);
    Iob.addConnection(this.socket);
    this.socket.subscribeState(this.adapterInstance + "*", (id, state) => {
      const obj = { id, state };
      this.storeHandler("updateAdapterStates", obj, 50);
      Iob.emitEvent("stateChange", obj);
    });
    this.socket.subscribeState("system.adapter." + this.adapterInstance + "*", (id, state) => {
      const obj = { id, state };
      //        console.log("stateChange:", obj)
      this.storeHandler("updateAdapterStates", obj, 50);
      Iob.emitEvent("stateChange", obj);
    });
    this.socket.subscribeObject(this.adapterInstance + "*", (id, newObj, oldObj) => {
      const obj = { id, newObj, oldObj };
      Iob.emitEvent("objectChange", obj);

//      console.log("objectChange:", obj);
      if (obj.id == "system.adapter." + this.adapterInstance) this.setInstanceConfig(obj.newObj);
      this.storeHandler("updateAdapterObjects", obj, 30);
    });
    this.socket.registerLogHandler((message) => {
      message.tss = Iob.timeStamp(message.ts);
      this.storeHandler("updateAdapterLog", message, 50);
    });
    //    this.socket.getAdapters().then(res => console.log("adapters", res));
    const { protocol, host, port } = this.socket.props;
    const serverName = `${protocol || "http:"}//${host || "localhost"}${port ? ":" + port : ""}`;
    //    console.log("serverName:", serverName);
    Iob.logSnackbar("Info;!getWebServerName %s", serverName);
    Iob.setStore.setServerName({ serverName, protocol, host, port });
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
      .then(() => Iob.initI18n("de"))
      .then(() => {
        // console.log(
        //   "translations:",
        //   Iob.i18n.getDataByLanguage("en"),
        //   Iob.i18n.getDataByLanguage("de")
        // );
        Iob.changeLanguage("de");
        this.forceUpdate();
        Iob.connection.getObjects((objects) => Iob.setStore.setadapterObjects(objects));
      })
      .then(() =>
        this.socket
          .getObject(this.instanceId)
          .then((i) => this.setInstanceConfig(i))
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
          const translation = this.props.configPage.translation;
          if (typeof translation === "object") {
            Iob.logSnackbar(
              "info;!translation loaded: %s",
              JSON.stringify(Iob.mergeCombinedTranslation(translation))
            );
          }
          //          Iob.logSnackbar("success;config.json loaded");
          /*           Iob.connection
            .getAdapters()
            .then((r) => console.log("getAdapters:", r))
            .then(() =>
              Iob.connection
                .getAdapterInstances()
                .then((r) => console.log("getAdapterInstances:", r))
            );
 */
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
