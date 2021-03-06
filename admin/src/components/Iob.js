import React from "react";
import I18next from "i18next";
import store, {
  ioBroker,
  connect,
  bindActionCreators,
} from "../store/ioBroker";
import { saveAs } from "file-saver";
import theme from "./Theme";
import Connection, { PROGRESS } from "./Connection";
import { IconButton } from "@material-ui/core";
//import test2 from "../../assets/config.json";
//import test1 from "../../assets/config.js";
//console.log("just for development!", !!test2, !!test1);

//import Iob from "./components/Iob"

const NAMESPACE = "material";
const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

store.$i18n = store.$i18n || I18next.createInstance();
store.$notFoundI18n = store.$notFoundI18n || {};
store.$connection = store.$connection || null;
store.$events = store.$events || new EventTarget();
store.$theme = store.$theme || theme;
store.$dialogs = store.$dialogs || {};
//console.log("events:", store.$events);

class Iob {
  static boundActionCreators = bindActionCreators(
    ioBroker.actions,
    store.dispatch
  );
  static connect = connect;
  static store = store;
  static ioBroker = ioBroker;

  static notFoundI18n = store.$notFoundI18n;
  static i18n = store.$i18n;

  static styles(theme) {
    const light = theme.palette.type === "light";
    const bottomLineColor = light
      ? "rgba(0, 0, 0, 0.42)"
      : "rgba(255, 255, 255, 0.7)";

    return {
      root: {},

      input: {
        marginTop: 0,
        minWidth: 400,
      },
      button: {
        marginRight: 20,
      },
      card: {
        maxWidth: 345,
        textAlign: "center",
      },
      media: {
        height: 180,
      },
      column: {
        display: "inline-block",
        verticalAlign: "top",
        marginRight: 10,
      },
      columnLogo: {
        //        width: 350,
        marginRight: 0,
      },
      columnSettings: {
        //      width: "calc(100% - 370px)",
      },
      code: {
        backgroundColor: "pink",
        padding: "2px, 2px",
      },
      controlElement: {
        //background: "#d2d2d2",
        //      marginBottom: 5,
      },
    };
  }

  static get events() {
    return store.$events;
  }

  static emitEvent(type, message) {
    const e = new Event(type);
    e.message = message;
    store.$events.dispatchEvent(e);
  }

  static removeEventListener(type, listener) {
    store.$events.removeEventListener(type, listener);
  }

  static addEventListener(type, listener) {
    store.$events.addEventListener(type, listener);
  }

  static get getStore() {
    return store.getState();
  }

  static get setStore() {
    return Iob.boundActionCreators;
  }

  static get connection() {
    return store.$connection;
  }

  static addConnection(connection) {
    store.$connection = connection;
  }

  static printPrompt() {
    const prompt = `
██╗ ██████╗ ██████╗ ██████╗  ██████╗ ██╗  ██╗███████╗██████╗ 
██║██╔═══██╗██╔══██╗██╔══██╗██╔═══██╗██║ ██╔╝██╔════╝██╔══██╗
██║██║   ██║██████╔╝██████╔╝██║   ██║█████╔╝ █████╗  ██████╔╝
██║██║   ██║██╔══██╗██╔══██╗██║   ██║██╔═██╗ ██╔══╝  ██╔══██╗
██║╚██████╔╝██████╔╝██║  ██║╚██████╔╝██║  ██╗███████╗██║  ██║
╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
`;
    console.log(prompt);
    console.log(
      "Nice to see you here! :) Join our dev community here https://github.com/ioBroker/ioBroker or here https://github.com/iobroker-community-adapters"
    );
    console.log("Help us to create open source project with reactJS!");
    console.log("See you :)");
  }

  static resizeTimer = null;
  static onResize = () => {
    Iob.resizeTimer && clearTimeout(Iob.resizeTimer);
    Iob.resizeTimer = setTimeout(() => {
      Iob.resizeTimer = null;
      Iob.setStore.setWidth(Iob.getWidth());
    }, 200);
  };
  static getWidth() {
    /**
     * innerWidth |xs      sm      md      lg      xl
     *            |-------|-------|-------|-------|------>
     * width      |  xs   |  sm   |  md   |  lg   |  xl
     */

    const SIZES = {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    };
    const width = window.innerWidth;
    const keys = Object.keys(SIZES).reverse();
    const widthComputed = keys.find((key) => width >= SIZES[key]);

    return widthComputed || "xs";
  }

  static isFrame() {
    let isIFrame;
    try {
      isIFrame = window.self !== window.top;
    } catch (e) {
      isIFrame = true;
    }
    return isIFrame;
  }

  static onClose() {
    if (typeof window.parent !== "undefined" && window.parent) {
      try {
        if (
          window.parent.$iframeDialog &&
          typeof window.parent.$iframeDialog.close === "function"
        ) {
          window.parent.$iframeDialog.close();
        } else {
          window.parent.postMessage("close", "*");
        }
      } catch (e) {
        window.parent.postMessage("close", "*");
      }
    }
  }

  static t(text, ...args) {
    if (Array.isArray(text)) return text.map((i) => Iob.t(i, ...args));
    //    if (text == "add new entry to {0}") debugger;
    if (text.startsWith("!")) text = text.slice(1);
    else {
      const nargs =
        args.length && Iob.type(args[0]).object
          ? args
          : args.length
          ? [args]
          : [];
      const ntext = Iob.i18n.t(text, ...nargs);
      if (ntext && ntext != text) text = ntext;
      else {
        //        console.log("Translate not found:", text, ntext, args);
        Iob.notFoundI18n[text]
          ? ++Iob.notFoundI18n[text]
          : (Iob.notFoundI18n[text] = 1);
      }
    }

    if (args.length)
      text = text.replace(/\{\s*([0-9]+)\s*\}/g, (m, i) => args[parseInt(i)]);
    return text;
  }

  static syntaxHighlight(json) {
    if (typeof json !== "string") return "";
    const _number = "color:darkgreen",
      _string = "color:maroon",
      _boolean = "color:blue",
      _null = "color:magenta",
      _key = "color:red";
    json = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return json
      .replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
          var cls = _number;
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = _key;
            } else {
              cls = _string;
            }
          } else if (/true|false/.test(match)) {
            cls = _boolean;
          } else if (/null/.test(match)) {
            cls = _null;
          }
          return '<span style="' + cls + ';">' + match + "</span>";
        }
      )
      .replace(/\n/g, "<br/>")
      .replace(/\t/g, "\u00a0\u00a0\u00a0\u00a0");
  }

  static stringify(val, depth, replacer, space) {
    if (typeof replacer === "string" && space === undefined) {
      space = replacer;
      replacer = null;
    }
    depth = isNaN(+depth) ? 1 : depth;
    function _build(key, val, depth, o, a) {
      // (JSON.stringify() has it's own rules, which we respect here by using it for property iteration)
      return !val || typeof val != "object"
        ? val
        : ((a = Array.isArray(val)),
          JSON.stringify(val, function (k, v) {
            if (a || depth > 0) {
              if (replacer) v = replacer(k, v);
              if (!k) return (a = Array.isArray(v)), (val = v);
              !o && (o = a ? [] : {});
              o[k] = _build(k, v, a ? depth : depth - 1);
            }
          }),
          o || (a ? [] : {}));
    }
    return JSON.stringify(_build("", val, depth), null, space);
  }

  static type(obj) {
    function getAnyClass(obj) {
      if (typeof obj === "undefined") return "undefined";
      if (obj === null) return "null";
      return obj.constructor.name;
    }
    const res = { typeof: typeof obj, class: getAnyClass(obj) };
    if (res.class === "null" || res.class === "undefined") res.empty = true;
    else {
      if (Array.isArray(obj)) res.typeof = "array";
      res[res.typeof] = true;
    }
    return res;
  }

  static nbsp(text = " ") {
    if (typeof text === "number") {
      let num = text > 100 ? 100 : text;
      num = num < 1 ? 1 : num;
      text = "";
      while (num) {
        --num;
        text += "\u00a0";
      }
      return text;
    }
    if (typeof text === "string") return text.replace(/ /g, "\u00a0");
    return "\u00a0";
  }

  static timeDiffA(ts) {
    let diff = Date.now() - ts;
    let dd = 1000 * 60 * 60 * 24;
    let s = [];
    function dod(div, txt) {
      const rest = diff % dd;
      const ndiff = diff - rest;
      const res = ndiff / dd;
      dd = dd / div;
      diff = rest;
      s.push([res, txt]);
    }
    dod(24, "days");
    dod(60, "hours");
    dod(60, "minutes");
    dod(1000, "seconds");
    s.push([diff, "ms"]);
    return s;
  }

  static timeDiffS(ts) {
    const a = Iob.timeDiffA(ts);
    let i = 0;
    let s = "";
    while (i < a.length && !a[i][0]) ++i;
    if (i >= a.length - 1) return "now";
    let [rest, name] = a[i];
    return rest + name[0] + " ago";
    while (i < a.length - 1) {
      const [rest, name] = a[i];
      let rs = rest.toString();
      if (i && rs.length < 2) rs = "0" + rs;
      s += (i < 4 ? "" : " ") + rs + (i == 0 ? "d " : i < 3 ? ":" : "");
      ++i;
    }
    return s + (s.length == 2 ? "''" : "") + " ago";
  }

  static timeStamp(ts, addDays = false) {
    function digits(v, p) {
      p = p || 2;
      v = v.toString();
      while (v.length < p) v = "0" + v;
      return v;
    }
    const now = Date.now();
    const d = new Date(ts);
    const timeAgo = now - ts;
    let days = -Math.floor(timeAgo / 1000.0 / 60.0 / 60.0 / 24.0);
    days = addDays && days < 0 ? days.toString() + "@" : "";
    return `${days}${digits(d.getHours())}:${digits(d.getMinutes())}:${digits(
      d.getSeconds()
    )}.${digits(d.getMilliseconds(), 3)}`;
  }

  static initI18n(lang) {
    const { displaylanguage, translations } = Iob.getStore;
    if (!lang) lang = Iob.getStore.displayLanguage || "en";
    const options = {
      lng: lang || "en",
      fallbackLng: "en",
      ns: [],
      /*         saveMissing: true,
      missingKeyHandler: (lng, ns, key, fallbackValue) => {
        notFoundI18n[key] ? ++notFoundI18n[key] : (notFoundI18n[key] = 1);

        console.log("i18n:missing", lng, ns, key, fallbackValue, notFoundI18n);
      },
*/

      initImmediate: false,
      supportedLngs: Object.keys(translations),
      keySeparator: false,
      nsSeparator: false,
      //          debug: true,
    };
    //    console.log("i18n options:", options);
    return (
      Iob.i18n
        .init(options)
        .then(() => Iob.addLanguageData("en", translations.en), true, true)
        .then(() => {
          if (lang && lang != "en" && translations[lang])
            Iob.addLanguageData(lang, translations[lang]);
        })
        //    .then(() => i18n.reloadResources(null, "translations"))
        .catch((err) => console.log("something went wrong loading i18n", err))
      // .then(() => {
      //   console.log("after i18n init:", Iob.t("key")); // -> same as i18next.t
      // })
    );
  }

  static setDialog(type, fun) {
    store.$dialogs[type.trim()] = fun;
  }

  static showDialog(what, how) {
    const dialog = store.$dialogs;
    if (typeof what === "string") {
      const fun = dialog[what.trim()];
      return fun && fun(how);
    }
    if (typeof what === "object" && what !== null) {
      const typ = what.type || "default";
      const fun = dialog[what.type];
      return fun && fun(what);
    }
    Iob.logSnackbar(
      "warning;cannot find dialog '{0}'/'{1}' to show",
      JSON.stringify(what),
      JSON.stringify(how)
    );
  }

  static getDialog(options = {}) {
    return new Promise((resolve, reject) => {
      const opts = Object.assign(
        {},
        {
          callback: (r) => {
            if (opts.rejectResult) {
              if (r === false || r === null || r === undefined)
                return reject(r);
            }
            resolve(r);
          },
        },
        options
      );
      Iob.showDialog(opts);
    });
  }
  static createConnection(options) {
    const nsocket = (store.$connection = new Connection({
      ...options,
      name: options.adapterName,
      doNotLoadAllObjects: true,
      autoSubscribeLog: true,
      onProgress: (progress) => {
        if (progress === PROGRESS.CONNECTING) {
          Iob.setStore.setConnected(false);
          //          this.setState({ connected: false });
        } else if (progress === PROGRESS.READY) {
          Iob.setStore.setConnected(true);
          //          this.setState({ connected: true });
        } else {
          Iob.setStore.setConnected(true);
          //          this.setState({ connected: true });
        }
      },
      onReady: (objects, scripts) => {
        const systemConfig = objects && objects["system.config"];
        //        console.log("SystemConfig", systemConfig);
        if (!systemConfig)
          return console.log("error: did not get system config!");

        (systemConfig
          ? Promise.resolve(systemConfig)
          : nsocket.getObject("system.config")
        )
          .then((obj) => {
            //                                                    this.common = obj && obj.common;
            Iob.setStore.setSystemConfig(obj);
            //                                    this.onPrepareLoad(obj.native); // decode all secrets
            Iob.initI18n(obj.common.language);

            store.$secret =
              (typeof obj !== "undefined" && obj.native && obj.native.secret) ||
              "Zgfr56gFe87jJOM";
            return nsocket.getObject(Iob.getStore.instanceId);
          })
          .then((obj) => {
            let waitPromise = Promise.resolve();

            // read UUID and init sentry with it.
            /*             if (!this.sentryInited) {
              this.sentryInited = true;

              if (window.location.host !== "localhost:3000") {
                waitPromise = nsocket.getObject("system.meta.uuid").then((uuidObj) => {
                  if (uuidObj && uuidObj.native && uuidObj.native.uuid) {
                    Sentry.configureScope((scope) => scope.setUser({ id: uuidObj.native.uuid }));
                  }
                });
              }
            } */
            return waitPromise.then(() => {
              if (obj) {
                //                console.log("InstanceConfig", obj);
                //                Iob.setStore.setInstanceConfig(obj);
                //                                    this.setState({native: obj.native, loaded: true}, () => this.onConnectionReady && this.onConnectionReady());
                setTimeout(
                  () =>
                    Promise.resolve(Iob.onConnectionReady(obj)).then(() =>
                      Iob.setStore.setLoaded(true)
                    ),
                  100
                );
              } else {
                console.warn("Cannot load instance settings");
                Iob.logSnackbar("error;Cannot connect and load settings!");
                //                                    this.setState({native: {}, loaded: true}, () => this.onConnectionReady && this.onConnectionReady());
              }
            });
          });
      },
      onError: (err) => {
        console.error(err);
        Iob.logSnackbar("error; Connection Error: {0}", err);
      },
    }));
  }

  static setConnection(connection) {
    store.$connection = connection;
  }

  static get connection() {
    return store.$connection;
  }

  static commandSend(cmd, ...args) {
    const conn = store.$connection;
    if (!conn || !conn.connected) return Promise.reject(NOT_CONNECTED);

    return new Promise((resolve, reject) =>
      conn._socket.emit(cmd, ...args, (err) => (err ? reject(err) : resolve()))
    );
  }

  static commandReceive(cmd, ...args) {
    const conn = store.$connection;
    if (!conn || !conn.connected) return Promise.reject(NOT_CONNECTED);

    return new Promise((resolve, reject) =>
      conn._socket.emit(cmd, ...args, (err, result) =>
        err ? reject(err) : resolve(result)
      )
    );
  }

  static sendToHost(
    host = Iob.getStore.instanceConfig.common.host,
    cmd,
    ...args
  ) {
    const conn = store.$connection;
    if (!conn || !conn.connected) return Promise.reject(NOT_CONNECTED);

    return new Promise((resolve) =>
      conn._socket.emit(
        "sendToHost",
        host || Iob.getStore.instanceConfig.common.host,
        cmd,
        ...args,
        (result) => resolve(result)
      )
    );
  }

  static sendTo(instance, command, data) {
    const conn = store.$connection;
    if (!conn || !conn.connected) return Promise.reject(NOT_CONNECTED);
    instance = instance || Iob.getStore.adapterInstance;
    return new Promise((resolve) =>
      conn._socket.emit("sendTo", instance, command, data, (result) =>
        resolve(result)
      )
    );
  }

  static getTranslatedDesc(desc) {
    if (!desc) return "";
    if (type(desc).class !== "Object") return desc;
    const i18 = Iob.i18n;
    const lang = i18.language || "en";
    let fallback = (i18.options && i18.options.fallbackLng) || ["en"];
    if (fallback && !Array.isArray(fallback)) fallback = [fallback];
    fallback = [lang].concat(fallback);
    for (const l of fallback) if (desc[l]) return desc[l];
    const dk = Object.keys(desc);
    if (dk.length) return desc[dk[0]];
    return desc;
  }

  static addLanguageData(lng, translation) {
    //    console.log("addLanguageData", lng, translation);
    if (typeof Iob.i18n.addResourceBundle === "function")
      return Iob.i18n.addResourceBundle(
        lng,
        "translation",
        translation,
        true,
        true
      );
  }

  static changeLanguage(lng = "en") {
    const { displayLanguage, translations } = Iob.getStore;

    if (/* lng != "en" &&  */ translations[lng]) {
      return Promise.resolve(
        Iob.addLanguageData(lng, translations[lng]),
        true,
        true
      )
        .then(() => {
          //          console.log("change lang", lng, Iob.i18n)
          Iob.i18n.changeLanguage(lng);
          Iob.setStore.setDisplayLanguage(lng);
        })
        .catch((e) => Iob.logSnackbar("info;language changed to {0}", [lng]));
    }
    return Promise.reject(`Could not load i18n language ´${lng}´!`);
  }

  static mergeTranslations(ntranslations = {}) {
    const { displayLanguage, translations } = Iob.getStore;
    const ctrans = Object.assign({}, translations);
    //    console.log(displayLanguage, ntranslations, ctrans);
    Object.keys(ntranslations).forEach((lang) => {
      if (!ctrans[lang]) ctrans[lang] = {};
      // console.log(ctrans[lang], ntranslations[lang]);
      const ntrans = (ctrans[lang] = Object.assign(
        {},
        ctrans[lang],
        ntranslations[lang]
      ));
      if (lang == displayLanguage || lang == "en")
        Iob.addLanguageData(lang, ntrans);
    });
    Iob.setStore.setTranslations(ctrans);
  }

  static mergeCombinedTranslation(ntranslations = {}) {
    const ntrans = {};
    for (const key of Object.keys(ntranslations))
      for (const lng of Object.keys(ntranslations[key])) {
        if (!ntrans[lng]) ntrans[lng] = {};
        ntrans[lng][key] = ntranslations[key][lng];
      }
    return Iob.mergeTranslations(ntrans);
  }

  static saveFile(what, opts, e) {
    let {
      mime = "text/plain",
      name = "filename",
      stringify = false,
      ending = ".txt",
    } = opts || {};

    if (stringify || typeof what !== "string")
      try {
        what = JSON.stringify(what);
        if (stringify) {
          mime = "application/json";
          ending = ".json";
        }
      } catch (e) {
        what = "JSON.stringify error in savefile:" + e;
        Iob.logSnackbar(`error;${what}{0}`, [e]);
      }
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      //        this.$emit("shiftclick", e);
      Iob.copyToClipboard(what);
      Iob.logSnackbar("success;copied text to clipboard");
      return false;
    }

    const blob = new Blob([what], {
      type: mime + ";charset=utf-8",
    });

    //      console.log(name, prepend, value, typ, str);
    return saveAs(blob, name + ending);
  }

  static trimL(text = "", len = 50, end = 3) {
    if (text.length > len - 3)
      return text.slice(0, len - 3 - end) + "..." + text.slice(-end);
    return text;
  }

  static stringToArrayComma(value = []) {
    //    const { value } = this.props;
    const res = Iob.stringToArray(value);
    //    console.log("stringToArray", value, res);
    return res;
  }

  static stringToArray(val, what = ",") {
    if (typeof val !== "string") return val;
    const ret = val.split(what).map((i) => i.trim());
    if (ret.length == 1 && !ret[0]) ret.splice(0, 1);
    //    console.log(val, ret);
    return ret;
  }

  static uniqueTableRule(val, ...args) {
    console.log("uniqueTableRule", val, ...args);
    if (!this || !this.props) return true;
    const { table, field } = this.props;
    if (!table || !field) return true;
    const v = ("" + val).trim();
    const found = table.filter((i) => ("" + i[field]).trim() == v);
    return (
      found.length < 1 ||
      t("This item can only be once per table in this field!")
    );
  }

  static onlyWords(val) {
    if (Array.isArray(val)) val = val[0];
    //      debugger;
    return (
      !!val.match(/^[\u00C0-\u017Fa-zA-Z0-9_\-\@\$\/]+$/) ||
      t("Only letters, numbers and `_ - @ $ /` are allowed!")
    );
  }

  static makeFunction(from, that, ...args) {
    if (typeof from == "function") return from;
    // else if (Array.isArray(rule)) {
    //   rule = rule.map(i => i.trim());
    else if (typeof from == "object") {
      if (typeof from.regexp == "string") {
        const m = from.regexp.match(/^\/(.*)\/([gimy]*)$/);
        const re = m ? new RegExp(...m.slice(1, 3)) : null;
        let f;
        if (re) {
          f = (v) => {
            if (Array.isArray(v)) v = v.slice(-1)[0];
            return !!(v || "").match(re) || t(from.message, v);
          };
        } else {
          f = (v) => {
            if (Array.isArray(v)) v = v.slice(-1)[0];
            // console.log(v);
            return (v || "").indexOf(from.regexp) >= 0 || t(from.message, v);
          };
        }
        return that ? f.bind(that) : f;
      } else if (Iob.type(from.regexp).class == "RegExp") {
        let f = (v) => {
          if (Array.isArray(v)) v = v.slice(-1)[0];
          return !!(v || "").match(from.regexp) || t(from.message, v);
        };
        return f.bind(that);
      }
    } else if (typeof from === "string" && from.trim()) {
      if (that && that.from && typeof that[from] === "function")
        return that[from].bind(that);
      if (that && typeof Iob[from] === "function") return Iob[from].bind(that);
      from = [...args, from.trim()];
      try {
        let b = from[from.length - 1];
        b = b.startsWith("return ") || b.startsWith("{") ? b : `return ${b};`;
        from[from.length - 1] = b;
        /*         const t = t;
        const React = React;
 */ const f = new Function(
          ...from
        );
        return that ? f.bind(that) : f;
      } catch (e) {
        console.log(
          `makeFunction error ${e} in function generation with: ${from}`
        );
        Iob.logSnackbar(
          "error;makeFunction error {0} in function generation with: {0}",
          e,
          from
        );
      }
    } else
      console.log("makeFunction - Invalid function content in rule:", from);
    return null;
  }

  static customFilter(item, queryText /* , itemText */) {
    function find(item, text) {
      if (typeof item === "number") item = item.toString();
      if (typeof item === "string") {
        item = item.toLowerCase();
        if (item.indexOf(text) > -1) return true;
      }
      if (item && typeof item === "object")
        for (const [i, v] of Object.entries(item))
          if (find(v, text)) return true;
      return false;
    }

    function msplit(text, char) {
      if (typeof text !== "string") return [];
      const arr = text.split(char).map((i) => i.trim());
      if (!arr.length) return [];
      if (arr.length === 1) return arr[0] ? [arr[0]] : [];
      const ret = [];
      let first = "";
      if (char === " ") char = "";
      for (const ii of arr) {
        if (ii) ret.push(first + ii);
        first = char;
      }
      // if (item.name.startsWith("A1:"))
      //   console.log("msplit:", "'" + char + "'", text, lctext, arr, ret);
      return ret;
    }

    if (!item || !queryText) return true;
    const lctext = queryText.toLowerCase().trim();
    let strs = msplit(lctext, " ");
    let tmp = [];
    for (const i in strs) tmp.push(msplit(strs[i], "+"));
    strs = [].concat.apply([], tmp);
    // strs = strs.reduce((prev, curr) => prev.concat(curr));
    // strs = strs.reduce((prev, curr) => prev.concat(curr));
    tmp = [];
    for (const j in strs) tmp.push(msplit(strs[j], "-"));
    strs = [].concat.apply([], tmp);
    // strs = strs.reduce((prev, curr) => prev.concat(curr));
    // strs = strs.reduce((prev, curr) => prev.concat(curr));
    //      if (lctext.indexOf(" ")) strs = lctext.split(" ").filter((i) => !!i);
    // if (item.name.startsWith("A1:")) console.log("split:", strs);
    let found = false,
      first = true,
      sign;
    for (const text of strs) {
      if (typeof text !== "string") continue;
      let ltext = text;
      if (ltext.startsWith("+")) {
        ltext = ltext.slice(1);
        sign = "+";
      } else if (ltext.startsWith("-")) {
        ltext = ltext.slice(1);
        sign = "-";
      }
      const fnd = find(item, ltext);
      if (sign === "-" && fnd) return false;
      else if (sign === "+" && !fnd) return false;
      else found = found || fnd;
      // if (item.name.startsWith("A1:"))
      //   console.log("Find:", sign, fnd, found, ltext, strs);
      first = false;
    }
    return found;
  }

  static updateObjectValue(obj, attrs, value) {
    if (typeof attrs !== "object") {
      attrs = attrs.split(".");
    }
    const attr = attrs.shift();
    if (attr === "$undefined") return false;
    if (!attrs.length) {
      //          console.log(`UpdateLast ${attr} ${obj[attr]} ${value}`);
      if (
        value !== undefined &&
        value !== null &&
        (typeof value === "object" || Array.isArray(value))
      ) {
        if (JSON.stringify(obj[attr]) !== JSON.stringify(value)) {
          obj[attr] = value;
          return true;
        }
      } else if (obj[attr] != value) {
        obj[attr] = value;
        return true;
      } else {
        return false;
      }
    } else {
      obj[attr] = obj[attr] || {};
      if (typeof obj[attr] !== "object" && !Array.isArray(obj[attr])) {
        throw new Error(
          "attribute " + attr + " is no object, but " + typeof obj[attr]
        );
      }
      return Iob.updateObjectValue(obj[attr], attrs, value);
    }
  }

  static updateInativeValue(inative, attr, value) {
    const native = JSON.parse(JSON.stringify(inative));
    if (Iob.updateObjectValue(native, attr, value))
      Iob.setStore.updateInativeValue(native);
    return native;
  }

  static isPartOf(val, list) {
    if (!Array.isArray(list)) {
      if (typeof list !== "string") return false;
      list = list.split("|");
    }
    return list.indexOf(val) >= 0;
  }

  static setSecret(secret) {
    store.$secret = secret;
  }

  static encrypt(value) {
    let result = "";
    for (let i = 0; i < value.length; i++) {
      result += String.fromCharCode(
        store.$secret[i % store.$secret.length].charCodeAt(0) ^
          value.charCodeAt(i)
      );
    }
    return result;
  }

  /**
   * Decrypts a string.
   * @param {string} value
   * @returns {string}
   */
  static decrypt(value) {
    let result = "";
    for (let i = 0; i < value.length; i++) {
      result += String.fromCharCode(
        store.$secret[i % store.$secret.length].charCodeAt(0) ^
          value.charCodeAt(i)
      );
    }
    return result;
  }

  static mergeProps(old, add) {
    const { style: oldStyle, ...oldRest } = old || {};
    const { style: addStyle, ...addRest } = add || {};
    const style =
      oldStyle || addStyle
        ? { style: { ...oldStyle, ...addStyle } }
        : undefined;
    return Object.assign({}, oldRest, addRest, style);
  }

  static setInstanceConfig(i) {
    //        this.setState({ instanceConfig: i });
    let native = i.native;
    const { configPage, inative } = Iob.getStore;
    Iob.setStore.setInstanceConfig(i);
    if (native) {
      native = Iob.onPrepareLoad(
        native,
        configPage && configPage.encryptedFields
      );
      Iob.setStore.setInative({ iNew: native, iOld: inative });
    } else Iob.logSnackbar("error;inative not loaded {0}", e);
  }

  static storeHandler(storeEntry, payload, time = 100) {
    if (!Iob.storetimeouts[storeEntry])
      Iob.storetimeouts[storeEntry] = { tmp: [], timeout: null, last: null };
    const stateEntry = Iob.storetimeouts[storeEntry];
    const { tmp, timeout, last } = stateEntry;
    if (JSON.stringify(last) != JSON.stringify(payload)) {
      tmp.push(payload);
      stateEntry.last = payload;
      //        console.log(payload);
    }
    if (tmp.length == 1 && !timeout)
      stateEntry.timeout = setTimeout(() => {
        stateEntry.timeout = null;
        const fun = Iob.setStore[storeEntry];
        //        console.log(storeEntry, fun, stateEntry.tmp);
        fun(tmp);
        stateEntry.tmp = [];
      }, time);
  }

  static onConnectionReady(iConfig) {
    const socket = Iob.connection;
    const setStore = Iob.setStore;
    const { adapterInstance, instanceId } = Iob.getStore;
    Iob.addConnection(Iob.connection);

    socket.registerLogHandler((message) => {
      message.tss = Iob.timeStamp(message.ts);
      Iob.storeHandler("updateAdapterLog", message, 50);
    });
    const { protocol, hostname, port } = Iob.getStore.location;
    const serverName = `${protocol || "http:"}//${hostname || "localhost"}${
      port ? ":" + port : ""
    }`;

    //    Iob.logSnackbar("Info;!getWebServerName {0}", serverName);
    setStore.setServerName({ serverName, protocol, hostname, port });
    //    console.log(Iob.getStore.myLocation);
    return Promise.all([
      Promise.resolve(() => Iob.changeLanguage("de"))
        .catch((e) => console.log("Error in changeNanguage:", e))
        .then(() => {
          //        this.forceUpdate();
          socket.getObjects((objects) =>
            Iob.setStore.setAdapterObjects(objects)
          );
        })
        .then(() => Iob.setInstanceConfig(iConfig)),

      fetch("config.js", {
        headers: {
          "Content-Type": "application/javascript",
          Accept: "application/javascript",
        },
      })
        .then((r) => r.text())
        .then((r) => {
          const m = r.match(/^\s*export\s+default\s+/);
          if (m) r = r.slice(m[0].length);
          let fun = eval(r);
          //          console.log("got config from config.js", fun);
          return fun;
        })
        .then(
          (r) => r,
          (e) => {
            console.log("Error on config.js:", e);
            return fetch("config.json", {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }).then((r) => {
              console.log("try to get config fron config.json");
              return r.json();
            });
          }
        )
        .then((r) => {
          setStore.setConfigPage(r);
          const translation = r.translation;
          if (typeof translation === "object")
            Iob.mergeCombinedTranslation(translation);
        })
        .catch((e) => Iob.logSnackbar("error;config.json not loaded {0}", e)),
    ])
      .then(() =>
        Iob.getIpAddresses()
          .then((r) => setStore.setIpAddresses(r))
          .catch((e) => Iob.logSnackbar("error;ipAddress not loaded {0}", e))
      )
      .then(() => {
        socket.subscribeObject(adapterInstance + "*", (id, newObj, oldObj) => {
          const obj = { id, newObj, oldObj };
          Iob.emitEvent("objectChange", obj);
          if (obj.id == instanceId) Iob.setInstanceConfig(obj.newObj);
          Iob.storeHandler("updateAdapterObjects", obj, 30);
        });

        socket.subscribeObject(
          "system.adapter." + adapterInstance + "*",
          (id, newObj, oldObj) => {
            const obj = { id, newObj, oldObj };
            Iob.emitEvent("objectChange", obj);
            if (obj.id == instanceId) Iob.setInstanceConfig(obj.newObj);
            Iob.storeHandler("updateAdapterObjects", obj, 30);
          }
        );

        socket.subscribeState(adapterInstance + "*", (id, state) => {
          const obj = { id, state };
          Iob.storeHandler("updateAdapterStates", obj, 50);
          Iob.emitEvent("stateChange", obj);
        });

        socket.subscribeState(
          /* instanceId + "*" */ "system.adapter.*",
          (id, state) => {
            const obj = { id, state };
            Iob.storeHandler("updateAdapterStates", obj, 50);
            Iob.emitEvent("stateChange", obj);
          }
        );
      });
  }

  /**
   * Gets called before the settings are saved.
   * You may override this if needed.
   * @param {Record<string, any>} settings
   */
  static onPrepareSave(settings, encryptedFields) {
    encryptedFields =
      encryptedFields ||
      settings.encryptedFields ||
      (Iob.getStore.inative && Iob.getStore.inative.encryptedFields) ||
      [];
    // here you can encode values
    encryptedFields.forEach((attr) => {
      if (settings[attr]) {
        settings[attr] = this.encrypt(settings[attr]);
      }
    });
  }

  /**
   * Gets called after the settings are loaded.
   * You may override this if needed.
   * @param {Record<string, any>} settings
   */
  static onPrepareLoad(settings, encryptedFields) {
    encryptedFields =
      encryptedFields ||
      settings.encryptedFields ||
      (Iob.getStore.inative && Iob.getStore.inative.encryptedFields) ||
      [];
    // here you can encode values
    const nsettings = Object.assign({}, settings);
    encryptedFields.forEach((attr) => {
      if (nsettings[attr]) {
        nsettings[attr] = this.decrypt(settings[attr]);
      }
    });
    return nsettings;
  }

  static getExtendableInstances() {
    return Iob.commandReceive("getObjectView", "system", "instance", null).then(
      (doc) =>
        doc.rows
          .filter((item) => item.value.common.webExtendable)
          .map((item) => item.value),
      (err) => []
    );
  }

  /**
   * Gets the IP addresses of the given host.
   * @param {string} host
   */
  static getIpAddresses(host) {
    const { common } = Iob.getStore.instanceConfig;
    return new Promise((resolve, reject) => {
      store.$connection._socket.emit(
        "getHostByIp",
        host || common.host,
        (ip, _host) => {
          //        console.log(host, common, _host, ip);
          const IPs4 = [
            {
              name: "[IPv4] 0.0.0.0 - " + t("ra_Listen on all IPs"),
              address: "0.0.0.0",
              family: "ipv4",
            },
          ];
          const IPs6 = [{ name: "[IPv6] ::", address: "::", family: "ipv6" }];
          if (_host) {
            host = _host;
            if (
              host.native.hardware &&
              host.native.hardware.networkInterfaces
            ) {
              Object.keys(host.native.hardware.networkInterfaces).forEach(
                (eth) =>
                  host.native.hardware.networkInterfaces[eth].forEach(
                    (inter) => {
                      if (inter.family !== "IPv6") {
                        IPs4.push({
                          name:
                            "[" +
                            inter.family +
                            "] " +
                            inter.address +
                            " - " +
                            eth,
                          address: inter.address,
                          family: "ipv4",
                        });
                      } else {
                        IPs6.push({
                          name:
                            "[" +
                            inter.family +
                            "] " +
                            inter.address +
                            " - " +
                            eth,
                          address: inter.address,
                          family: "ipv6",
                        });
                      }
                    }
                  )
              );
            }
            IPs6.forEach((ip) => IPs4.push(ip));
          }
          resolve(IPs4);
        }
      );
    });
  }
  static storetimeouts = {};

  static configSave(isClose) {
    let oldObj;
    const { inative, instanceId, instanceConfig, configPage } = Iob.getStore;
    Iob.connection
      .getObject(instanceId)
      .then((_oldObj) => {
        oldObj = _oldObj || { native: {} };
        for (const a in inative) {
          if (inative.hasOwnProperty(a)) oldObj.native[a] = inative[a];
        }
        const common = instanceConfig.common;
        if (common) {
          for (const b in common) {
            if (common.hasOwnProperty(b)) {
              oldObj.common[b] = common[b];
            }
          }
        }
        Iob.setStore.setInative(inative);
        Iob.onPrepareSave(oldObj.native, configPage.encryptedFields);

        return Iob.connection.setObject(instanceId, oldObj);
      })
      .then(() => {
        isClose && Iob.onClose();
      });
  }

  static enqueueSnackbar(message, opts) {
    return store.$snackbarProvider.enqueueSnackbar(message, opts);
  }

  static closeSnackbar(key) {
    return store.$snackbarProvider.closeSnackbar(key);
  }

  static logSnackbar(text, ...args) {
    const st = text.split(";");
    let variant = undefined;
    if (st.length > 1) {
      text = st.slice(1).join(";");
      variant = st[0].trim().toLowerCase();
    }
    const key = new Date().getTime() + Math.random();
    const message = Iob.t(text, ...args);
    const options = { variant, key };
    if (variant == "error") {
      options.persist = true;
      console.log("logSnackbar", variant, text);
    }
    Iob.enqueueSnackbar(message, options);
  }
  static _findStateName(name) {
    const adapterObjects = Object.assign({}, Iob.getStore.adapterObjects);
    const { adapterStates, adapterInstance } = Iob.getStore;
    if (name.startsWith(".")) name = adapterInstance + name;
    let state = adapterStates[name];
    if (!state) {
      name = "system.adapter." + name;
      state = adapterStates[name];
    }
    const obj = adapterObjects[name];
    return { state, name: state ? name : "", common: obj && obj.common };
  }

  static getState(sname) {
    const { state, name, common } = Iob._findStateName(sname);
    //    console.log(name, state, common);
    const nstate = Object.assign({}, state, {
      _id: name,
    });
    if (common && common.name) nstate._common = common;
    else delete nstate._common;
    return nstate;
  }

  static getStateValue(oname) {
    const { state } = Iob._findStateName(oname);
    //    console.log("getStateValue", name, state);
    return state && state.val;
  }

  static setStateValue(oname, value) {
    const { state, name } = Iob._findStateName(oname);
    //    console.log("setStateValue", oname, name, state, value);
    if (state) Iob.commandSend("setState", name, value);
  }

  static enableDisableAdapter(what, adapter = Iob.getStore.adapterInstance) {
    const id = "system.adapter." + adapter;
    const obj = { common: {} };
    if (typeof what == "boolean") {
      obj.common.enabled = !!what;
      Iob.connection.extendObject(id, obj);
    }
  }

  static setLoglevel(what, adapter = Iob.getStore.adapterInstance) {
    const level = typeof what === "sting" ? { loglevel: what } : {};
    const id = "system.adapter." + adapter;
    const obj = { common: level };
    return Iob.connection.extendObject(id, obj);
  }

  static namespace = NAMESPACE;
  static INSTANCES = "instances";
  static dateFormat = ["DD", "MM"];
  static FORBIDDEN_CHARS = /[\][*,;'"`<>\\?]/g;

  /**
   * Capitalize words.
   * @param {string | undefined} name
   * @returns {string}
   */
  static CapitalWords(name) {
    return (name || "")
      .split(/[\s_]/)
      .filter((item) => item)
      .map((word) =>
        word ? word[0].toUpperCase() + word.substring(1).toLowerCase() : ""
      )
      .join(" ");
  }

  /**
   * Get the name of the object by id from the name or description.
   * @param {Record<string, ioBroker.Object>} objects
   * @param {string} id
   * @param {{ name: any; } | ioBroker.Languages | null} settings
   * @param {{ language?: ioBroker.Languages; }} options
   * @param {boolean} [isDesc] Set to true to get the description.
   * @returns {string}
   */
  static getObjectName(objects, id, settings, options, isDesc) {
    let item = objects[id];
    let text = id;
    const attr = isDesc ? "desc" : "name";

    if (typeof settings === "string" && !options) {
      options = { language: settings };
      settings = null;
    }

    options = options || {};
    if (!options.language) {
      options.language =
        (objects["system.config"] &&
          objects["system.config"].common &&
          objects["system.config"].common.language) ||
        window.sysLang ||
        "en";
    }
    if (settings && settings.name) {
      text = settings.name;
      if (typeof text === "object") {
        text = text[options.language] || text.en;
      }
    } else if (item && item.common && item.common[attr]) {
      text = item.common[attr];
      if (attr !== "desc" && !text && item.common.desc) {
        text = item.common.desc;
      }
      if (typeof text === "object") {
        text = text[options.language] || text.en || text.de || text.ru || "";
      }
      text = (text || "").toString().replace(/[_.]/g, " ");

      if (text === text.toUpperCase()) {
        text = text[0] + text.substring(1).toLowerCase();
      }
    } else {
      let pos = id.lastIndexOf(".");
      text = id.substring(pos + 1).replace(/[_.]/g, " ");
      text = Iob.CapitalWords(text);
    }
    return text.trim();
  }

  /**
   * Get the name of the object from the name or description.
   * @param {ioBroker.PartialObject} obj
   * @param {{ name: any; } | ioBroker.Languages | null } settings or language
   * @param {{ language?: ioBroker.Languages; } } options
   * @param {boolean} [isDesc] Set to true to get the description.
   * @returns {string}
   */
  static getObjectNameFromObj(obj, settings, options, isDesc) {
    let item = obj;
    let text = (obj && obj._id) || "";
    const attr = isDesc ? "desc" : "name";

    if (typeof settings === "string" && !options) {
      options = { language: settings };
      settings = null;
    }

    options = options || {};

    if (settings && settings.name) {
      text = settings.name;
      if (typeof text === "object") {
        text = text[options.language] || text.en;
      }
    } else if (item && item.common && item.common[attr]) {
      text = item.common[attr];
      if (attr !== "desc" && !text && item.common.desc) {
        text = item.common.desc;
      }
      if (typeof text === "object") {
        text = text[options.language] || text.en;
      }
      text = (text || "").toString().replace(/[_.]/g, " ");

      if (text === text.toUpperCase()) {
        text = text[0] + text.substring(1).toLowerCase();
      }
    }
    return text.trim();
  }

  /**
   * @param {ioBroker.PartialObject | ioBroker.ObjectCommon} obj
   * @param {string} forEnumId
   * @param {{ user: string; }} options
   * @returns {string | null}
   */
  static getSettingsOrder(obj, forEnumId, options) {
    if (obj && obj.hasOwnProperty("common")) {
      obj = obj.common;
    }
    let settings;
    if (obj && obj.custom) {
      settings = (obj.custom || {})[NAMESPACE];
      const user = options.user || "admin";
      if (settings && settings[user]) {
        if (forEnumId) {
          if (settings[user].subOrder && settings[user].subOrder[forEnumId]) {
            return JSON.parse(
              JSON.stringify(settings[user].subOrder[forEnumId])
            );
          }
        } else {
          if (settings[user].order) {
            return JSON.parse(JSON.stringify(settings[user].order));
          }
        }
      }
    }
    return null;
  }

  /**
   * @param {ioBroker.PartialObject | ioBroker.ObjectCommon} obj
   * @param {string} forEnumId
   * @param {{ user: string; }} options
   */
  static getSettingsCustomURLs(obj, forEnumId, options) {
    if (obj && obj.hasOwnProperty("common")) {
      obj = obj.common;
    }
    let settings;
    if (obj && obj.custom) {
      settings = (obj.custom || {})[NAMESPACE];
      const user = options.user || "admin";
      if (settings && settings[user]) {
        if (forEnumId) {
          if (settings[user].subURLs && settings[user].subURLs[forEnumId]) {
            return JSON.parse(
              JSON.stringify(settings[user].subURLs[forEnumId])
            );
          }
        } else {
          if (settings[user].URLs) {
            return JSON.parse(JSON.stringify(settings[user].URLs));
          }
        }
      }
    }
    return null;
  }

  /**
   * Reorder the array items in list between source and dest.
   * @param {Iterable<any> | ArrayLike<any>} list
   * @param {number} source
   * @param {number} dest
   */
  static reorder(list, source, dest) {
    const result = Array.from(list);
    const [removed] = result.splice(source, 1);
    result.splice(dest, 0, removed);
    return result;
  }

  /**
   * @param {any} obj
   * @param {{ id: any; user: any; name: any; icon: any; color: any; language: ioBroker.Languages; }} options
   * @param {boolean} [defaultEnabling]
   */
  static getSettings(obj, options, defaultEnabling) {
    let settings;
    const id = (obj && obj._id) || (options && options.id);
    if (obj && obj.hasOwnProperty("common")) {
      obj = obj.common;
    }
    if (obj && obj.custom) {
      settings = obj.custom || {};
      settings =
        settings[NAMESPACE] && settings[NAMESPACE][options.user || "admin"]
          ? JSON.parse(
              JSON.stringify(settings[NAMESPACE][options.user || "admin"])
            )
          : { enabled: true };
    } else {
      settings = {
        enabled: defaultEnabling === undefined ? true : defaultEnabling,
        useCustom: false,
      };
    }

    if (!settings.hasOwnProperty("enabled")) {
      settings.enabled = defaultEnabling === undefined ? true : defaultEnabling;
    }

    if (false && settings.useCommon) {
      if (obj.color) settings.color = obj.color;
      if (obj.icon) settings.icon = obj.icon;
      if (obj.name) settings.name = obj.name;
    } else {
      if (options) {
        if (!settings.name && options.name) settings.name = options.name;
        if (!settings.icon && options.icon) settings.icon = options.icon;
        if (!settings.color && options.color) settings.color = options.color;
      }

      if (obj) {
        if (!settings.color && obj.color) settings.color = obj.color;
        if (!settings.icon && obj.icon) settings.icon = obj.icon;
        if (!settings.name && obj.name) settings.name = obj.name;
      }
    }

    if (typeof settings.name === "object") {
      settings.name = settings.name[options.language] || settings.name.en;

      settings.name = (settings.name || "").toString().replace(/_/g, " ");

      if (settings.name === settings.name.toUpperCase()) {
        settings.name =
          settings.name[0] + settings.name.substring(1).toLowerCase();
      }
    }
    if (!settings.name && id) {
      let pos = id.lastIndexOf(".");
      settings.name = id.substring(pos + 1).replace(/[_.]/g, " ");
      settings.name = (settings.name || "").toString().replace(/_/g, " ");
      settings.name = Iob.CapitalWords(settings.name);
    }

    return settings;
  }

  /**
   * @param {any} obj
   * @param {any} settings
   * @param {{ user: any; language: ioBroker.Languages; }} options
   */
  static setSettings(obj, settings, options) {
    if (obj) {
      obj.common = obj.common || {};
      obj.common.custom = obj.common.custom || {};
      obj.common.custom[NAMESPACE] = obj.common.custom[NAMESPACE] || {};
      obj.common.custom[NAMESPACE][options.user || "admin"] = settings;
      const s = obj.common.custom[NAMESPACE][options.user || "admin"];
      if (s.useCommon) {
        if (s.color !== undefined) {
          obj.common.color = s.color;
          delete s.color;
        }
        if (s.icon !== undefined) {
          obj.common.icon = s.icon;
          delete s.icon;
        }
        if (s.name !== undefined) {
          if (typeof obj.common.name !== "object") {
            obj.common.name = {};
            obj.common.name[options.language] = s.name;
          } else {
            obj.common.name[options.language] = s.name;
          }
          delete s.name;
        }
      }

      return true;
    } else {
      return false;
    }
  }

  /**
   * Get the icon for the given settings.
   * @param {{ icon: string | undefined; name: string | undefined; prefix: string | undefined}} settings
   * @param {any} style
   * @returns {JSX.Element | null}
   */
  static getIcon(settings, style) {
    if (settings && settings.icon) {
      // If UTF-8 icon
      if (settings.icon.length <= 2) {
        return <span style={style || {}}>{settings.icon}</span>;
      } else if (settings.icon.startsWith("data:image")) {
        return (
          <img alt={settings.name} src={settings.icon} style={style || {}} />
        );
      } else {
        // may be later some changes for second type
        return (
          <img
            alt={settings.name}
            src={(settings.prefix || "") + settings.icon}
            style={style || {}}
          />
        );
      }
    }
    return null;
  }

  static getObject(id) {
    const ao = Iob.getStore.adapterObjects;
    if (ao[id]) return ao[id];
    Iob.connection.getObject(id).then(
      (o) => {
        const obj = { id, newObj: o };
        Iob.emitEvent("objectChange", obj);
        if (obj.id == Iob.getStore.instanceId)
          Iob.setInstanceConfig(obj.newObj);
        Iob.storeHandler("updateAdapterObjects", obj, 30);
      },
      (e) => {}
    );
    return null;
  }

  /**
   * Get the icon for the given object.
   * @param {string} id
   * @param {{ common: { icon: any; }; }} obj
   * @returns {string | null}
   */
  static getObjectIcon(id, obj) {
    // If id is Object
    if (typeof id === "object") {
      obj = id;
      id = obj._id;
    }

    if (obj && obj.common && obj.common.icon) {
      let icon = obj.common.icon;
      // If UTF-8 icon
      if (typeof icon === "string" && icon.length <= 2) {
        return icon;
      } else if (icon.startsWith("data:image")) {
        return icon;
      } else {
        const parts = id.split(".");
        if (parts[0] === "system" && parts[1] === "adapter") {
          icon =
            "adapter/" + parts[2] + (icon.startsWith("/") ? "" : "/") + icon;
        } else {
          icon =
            "adapter/" + parts[0] + (icon.startsWith("/") ? "" : "/") + icon;
        }

        if (window.location.pathname.match(/adapter\/[^/]+\/[^/]+\.html/)) {
          icon = "../../" + icon;
        } else if (window.location.pathname.match(/material\/[.\d]+/)) {
          icon = "../../" + icon;
        } else if (window.location.pathname.match(/material\//)) {
          icon = "../" + icon;
        }
        return icon;
      }
    } else {
      return null;
    }
  }

  /**
   * Splits CamelCase into words.
   * @param {string | undefined} text
   * @returns {string}
   */
  static splitCamelCase(text) {
    if (false && text !== text.toUpperCase()) {
      const words = text.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (word.toLowerCase() !== word && word.toUpperCase() !== word) {
          let z = 0;
          const ww = [];
          let start = 0;
          while (z < word.length) {
            if (word[z].match(/[A-ZÜÄÖА-Я]/)) {
              ww.push(word.substring(start, z));
              start = z;
            }
            z++;
          }
          if (start !== z) {
            ww.push(word.substring(start, z));
          }
          for (let k = 0; k < ww.length; k++) {
            words.splice(i + k, 0, ww[k]);
          }
          i += ww.length;
        }
      }

      return words
        .map((w) => {
          w = w.trim();
          if (w) {
            return w[0].toUpperCase() + w.substring(1).toLowerCase();
          }
          return "";
        })
        .join(" ");
    } else {
      return Iob.CapitalWords(text);
    }
  }

  /**
   * Check if the given color is bright.
   * https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
   * @param {string | null | undefined} color
   * @param {boolean} [defaultValue]
   * @returns {boolean}
   */
  static isUseBright(color, defaultValue) {
    if (color === null || color === undefined || color === "") {
      return defaultValue === undefined ? true : defaultValue;
    }
    color = color.toString();
    if (color.indexOf("#") === 0) {
      color = color.slice(1);
    }
    let r;
    let g;
    let b;

    const rgb = color.match(
      /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
    );
    if (rgb && rgb.length === 4) {
      r = parseInt(rgb[1], 10);
      g = parseInt(rgb[2], 10);
      b = parseInt(rgb[3], 10);
    } else {
      // convert 3-digit hex to 6-digits.
      if (color.length === 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
      }
      if (color.length !== 6) {
        return false;
      }

      r = parseInt(color.slice(0, 2), 16);
      g = parseInt(color.slice(2, 4), 16);
      b = parseInt(color.slice(4, 6), 16);
    }

    // http://stackoverflow.com/a/3943023/112731
    return r * 0.299 + g * 0.587 + b * 0.114 <= 186;
  }

  /**
   * Get the time string in the format 00:00.
   * @param {string | number} seconds
   */
  static getTimeString(seconds) {
    seconds = parseFloat(seconds);
    if (isNaN(seconds)) {
      return "--:--";
    }
    const hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    if (hours) {
      if (minutes < 10) minutes = "0" + minutes;
      if (secs < 10) secs = "0" + secs;
      return hours + ":" + minutes + ":" + secs;
    } else {
      if (secs < 10) secs = "0" + secs;
      return minutes + ":" + secs;
    }
  }

  /**
   * Gets the wind direction with the given angle (degrees).
   * @param {number} angle in degrees.
   * @returns {string | undefined}
   */
  static getWindDirection(angle) {
    if (angle >= 0 && angle < 11.25) {
      return "N";
    } else if (angle >= 11.25 && angle < 33.75) {
      return "NNE";
    } else if (angle >= 33.75 && angle < 56.25) {
      return "NE";
    } else if (angle >= 56.25 && angle < 78.75) {
      return "ENE";
    } else if (angle >= 78.75 && angle < 101.25) {
      return "E";
    } else if (angle >= 101.25 && angle < 123.75) {
      return "ESE";
    } else if (angle >= 123.75 && angle < 146.25) {
      return "SE";
    } else if (angle >= 146.25 && angle < 168.75) {
      return "SSE";
    } else if (angle >= 168.75 && angle < 191.25) {
      return "S";
    } else if (angle >= 191.25 && angle < 213.75) {
      return "SSW";
    } else if (angle >= 213.75 && angle < 236.25) {
      return "SW";
    } else if (angle >= 236.25 && angle < 258.75) {
      return "WSW";
    } else if (angle >= 258.75 && angle < 281.25) {
      return "W";
    } else if (angle >= 281.25 && angle < 303.75) {
      return "WNW";
    } else if (angle >= 303.75 && angle < 326.25) {
      return "NW";
    } else if (angle >= 326.25 && angle < 348.75) {
      return "NNW";
    } else if (angle >= 348.75) {
      return "N";
    }
  }

  /**
   * Pad the given number with a zero if its not 2 digits long.
   * @param {string | number} num
   */
  static padding(num) {
    if (typeof num === "string") {
      if (num.length < 2) {
        return "0" + num;
      } else {
        return num;
      }
    } else if (num < 10) {
      return "0" + num;
    } else {
      return num;
    }
  }

  /**
   * Sets the date format.
   * @param {string} format
   */
  static setDataFormat(format) {
    if (format) {
      Iob.dateFormat = format.toUpperCase().split(/[.-/]/);
      Iob.dateFormat.splice(Iob.dateFormat.indexOf("YYYY"), 1);
    }
  }

  /**
   * Converts the date to a string.
   * @param {string | number | Date} now
   * @returns {string}
   */
  static date2string(now) {
    if (typeof now === "string") {
      now = now.trim();
      if (!now) return "";
      // only letters
      if (now.match(/^[\w\s]+$/)) {
        // Day of week
        return now;
      }
      let m = now.match(/(\d{1,4})[-./](\d{1,2})[-./](\d{1,4})/);
      if (m) {
        let a = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
        let year = a.find((y) => y > 31);
        a.splice(a.indexOf(year), 1);
        let day = a.find((m) => m > 12);
        if (day) {
          a.splice(a.indexOf(day), 1);
          now = new Date(year, a[0] - 1, day);
        } else {
          // MM DD
          if (Iob.dateFormat[0][0] === "M" && Iob.dateFormat[1][0] === "D") {
            now = new Date(year, a[0] - 1, a[1]);
            if (Math.abs(now.getTime - Date.now()) > 3600000 * 24 * 10) {
              now = new Date(year, a[1] - 1, a[0]);
            }
          }
          // DD MM
          else if (
            Iob.dateFormat[0][0] === "D" &&
            Iob.dateFormat[1][0] === "M"
          ) {
            now = new Date(year, a[1] - 1, a[0]);
            if (Math.abs(now.getTime - Date.now()) > 3600000 * 24 * 10) {
              now = new Date(year, a[0] - 1, a[1]);
            }
          } else {
            now = new Date(now);
          }
        }
      } else {
        now = new Date(now);
      }
    } else {
      now = new Date(now);
    }

    let date = I18n.t("ra_dow_" + days[now.getDay()]).replace("ra_dow_", "");
    date +=
      ". " +
      now.getDate() +
      " " +
      I18n.t("ra_month_" + months[now.getMonth()]).replace("ra_month_", "");
    return date;
  }

  /**
   * Render a text as a link.
   * @param {string} text
   * @returns {string | JSX.Element[]}
   */
  static renderTextWithA(text) {
    let m = text.match(/<a [^<]+<\/a>/);
    if (m) {
      const result = [];
      let key = 1;
      do {
        let href = m[0].match(/href="([^"]+)"/) || m[0].match(/href='([^']+)'/);
        let target =
          m[0].match(/target="([^"]+)"/) || m[0].match(/target='([^']+)'/);
        let rel = m[0].match(/rel="([^"]+)"/) || m[0].match(/rel='([^']+)'/);
        const title = m[0].match(/>([^<]*)</);

        const p = text.split(m[0]);
        p[0] && result.push(<span key={"a" + key++}>{p[0]}</span>);
        result.push(
          <a
            key={"a" + key++}
            href={href ? href[1] : ""}
            target={target ? target[1] : "_blank"}
            rel={rel ? rel[1] : ""}
          >
            {title ? title[1] : ""}
          </a>
        );
        text = p[1];
        m = text && text.match(/<a [^<]+<\/a>/);
        if (!m) {
          p[1] && result.push(<span key={"a" + key++}>{p[1]}</span>);
        }
      } while (m);
      return result;
    } else {
      return text;
    }
  }

  /**
   * Get the smart name of the given state.
   * @param {Record<string, ioBroker.StateObject> | ioBroker.StateObject} states
   * @param {string} id
   * @param {string} instanceId
   * @param {boolean} [noCommon]
   */
  static getSmartName(states, id, instanceId, noCommon) {
    if (!id) {
      if (!noCommon) {
        if (!states.common) {
          return states.smartName;
        } else {
          if (states && !states.common) {
            return states.smartName;
          } else {
            return states.common.smartName;
          }
        }
      } else {
        if (states && !states.common) {
          return states.smartName;
        } else {
          return states &&
            states.common &&
            states.common.custom &&
            states.common.custom[instanceId]
            ? states.common.custom[instanceId].smartName
            : undefined;
        }
      }
    } else if (!noCommon) {
      return states[id].common.smartName;
    } else {
      return states[id] &&
        states[id].common &&
        states[id].common.custom &&
        states[id].common.custom[instanceId]
        ? states[id].common.custom[instanceId].smartName || null
        : null;
    }
  }

  /**
   * Get the smart name from a state.
   * @param {ioBroker.StateObject} obj
   * @param {string} instanceId
   * @param {boolean} [noCommon]
   */
  static getSmartNameFromObj(obj, instanceId, noCommon) {
    if (!noCommon) {
      if (!obj.common) {
        return obj.smartName;
      } else {
        if (obj && !obj.common) {
          return obj.smartName;
        } else {
          return obj.common.smartName;
        }
      }
    } else {
      if (obj && !obj.common) {
        return obj.smartName;
      } else {
        return obj &&
          obj.common &&
          obj.common.custom &&
          obj.common.custom[instanceId]
          ? obj.common.custom[instanceId].smartName
          : undefined;
      }
    }
  }

  /**
   * Enable smart name for a state.
   * @param {ioBroker.StateObject} obj
   * @param {string} instanceId
   * @param {boolean} [noCommon]
   */
  static enableSmartName(obj, instanceId, noCommon) {
    if (noCommon) {
      obj.common.custom = obj.common.custom || {};
      obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
      obj.common.custom[instanceId].smartName = {};
    } else {
      obj.common.smartName = {};
    }
  }

  /**
   * Completely remove smart name from a state.
   * @param {ioBroker.StateObject} obj
   * @param {string | number} instanceId
   * @param {boolean} [noCommon]
   */
  static removeSmartName(obj, instanceId, noCommon) {
    if (noCommon) {
      if (obj.common && obj.common.custom && obj.common.custom[instanceId]) {
        obj.common.custom[instanceId] = null;
      }
    } else {
      obj.common.smartName = null;
    }
  }

  /**
   * Update the smartname of a state.
   * @param {ioBroker.StateObject} obj
   * @param {string} newSmartName
   * @param {string | undefined} byON
   * @param {string | undefined} smartType
   * @param {string} instanceId
   * @param {boolean} [noCommon]
   */
  static updateSmartName(
    obj,
    newSmartName,
    byON,
    smartType,
    instanceId,
    noCommon
  ) {
    const language = I18n.getLanguage();

    // convert Old format
    if (typeof obj.common.smartName === "string") {
      const nnn = obj.common.smartName;
      obj.common.smartName = {};
      obj.common.smartName[language] = nnn;
    }

    // convert old settings
    if (obj.native && obj.native.byON) {
      delete obj.native.byON;
      let _smartName = obj.common.smartName;

      if (!_smartName || typeof _smartName !== "object") {
        _smartName = { en: _smartName };
        _smartName[language] = _smartName.en;
      }
      obj.common.smartName = _smartName;
    }
    if (smartType !== undefined) {
      if (noCommon) {
        obj.common.custom = obj.common.custom || {};
        obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
        obj.common.custom[instanceId].smartName =
          obj.common.custom[instanceId].smartName || {};
        if (!smartType) {
          delete obj.common.custom[instanceId].smartName.smartType;
        } else {
          obj.common.custom[instanceId].smartName.smartType = smartType;
        }
      } else {
        obj.common.smartName = obj.common.smartName || {};
        if (!smartType) {
          delete obj.common.smartName.smartType;
        } else {
          obj.common.smartName.smartType = smartType;
        }
      }
    }
    if (byON !== undefined) {
      if (noCommon) {
        obj.common.custom = obj.common.custom || {};
        obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
        obj.common.custom[instanceId].smartName =
          obj.common.custom[instanceId].smartName || {};
        obj.common.custom[instanceId].smartName.byON = byON;
      } else {
        obj.common.smartName = obj.common.smartName || {};
        obj.common.smartName.byON = byON;
      }
    }
    if (newSmartName !== undefined) {
      let smartName;
      if (noCommon) {
        obj.common.custom = obj.common.custom || {};
        obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
        obj.common.custom[instanceId].smartName =
          obj.common.custom[instanceId].smartName || {};
        smartName = obj.common.custom[instanceId].smartName;
      } else {
        obj.common.smartName = obj.common.smartName || {};
        smartName = obj.common.smartName;
      }
      smartName[language] = newSmartName;

      // If smart name deleted
      if (
        smartName &&
        (!smartName[language] ||
          (smartName[language] === obj.common.name &&
            (!obj.common.role || obj.common.role.indexOf("button") >= 0)))
      ) {
        delete smartName[language];
        let empty = true;
        // Check if structure has any definitions
        for (const key in smartName) {
          if (smartName.hasOwnProperty(key)) {
            empty = false;
            break;
          }
        }
        // If empty => delete smartName completely
        if (empty) {
          if (noCommon) {
            if (obj.common.custom[instanceId].smartName.byON === undefined) {
              delete obj.common.custom[instanceId];
            } else {
              delete obj.common.custom[instanceId].en;
              delete obj.common.custom[instanceId].de;
              delete obj.common.custom[instanceId].ru;
              delete obj.common.custom[instanceId].nl;
              delete obj.common.custom[instanceId].pl;
              delete obj.common.custom[instanceId].it;
              delete obj.common.custom[instanceId].fr;
              delete obj.common.custom[instanceId].pt;
              delete obj.common.custom[instanceId].es;
              delete obj.common.custom[instanceId]["zh-cn"];
            }
          } else {
            if (obj.common.smartName.byON !== undefined) {
              delete obj.common.smartName.en;
              delete obj.common.smartName.de;
              delete obj.common.smartName.ru;
              delete obj.common.smartName.nl;
              delete obj.common.smartName.pl;
              delete obj.common.smartName.it;
              delete obj.common.smartName.fr;
              delete obj.common.smartName.pt;
              delete obj.common.smartName.es;
              delete obj.common.smartName["zh-cn"];
            } else {
              obj.common.smartName = null;
            }
          }
        }
      }
    }
  }

  /**
   * Disable the smart name of a state.
   * @param {ioBroker.StateObject} obj
   * @param {string} instanceId
   * @param {boolean} [noCommon]
   */
  static disableSmartName(obj, instanceId, noCommon) {
    if (noCommon) {
      obj.common.custom = obj.common.custom || {};
      obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
      obj.common.custom[instanceId].smartName = false;
    } else {
      obj.common.smartName = false;
    }
  }

  /**
   * Copy text to the clipboard.
   * @param {string} text
   * @param {Event} [e]
   */
  static copyToClipboard(text, e) {
    const el = window.document.createElement("textarea");
    if (typeof text !== "string") text = !text ? "" : JSON.stringify(text);
    el.value = text;
    window.document.body.appendChild(el);
    el.select();
    window.document.execCommand("copy");
    window.document.body.removeChild(el);
    //    console.log(text);
    e && e.stopPropagation();
    e && e.preventDefault();
    return text;
  }

  /**
   * Gets the extension of a file name.
   * @param {string | null} [fileName] the file name.
   * @returns {string | null} The extension in lower case.
   */
  static getFileExtension(fileName) {
    const pos = (fileName || "").lastIndexOf(".");
    if (pos !== -1) {
      return fileName.substring(pos + 1).toLowerCase();
    } else {
      return null;
    }
  }

  /**
   * Format number of bytes as a string with B, KB, MB or GB.
   * The base for all calculations is 1024.
   * @param {number} bytes The number of bytes.
   * @returns {string} The formatted string (e.g. '723.5 KB')
   */
  static formatBytes(bytes) {
    if (Math.abs(bytes) < 1024) {
      return bytes + " B";
    }

    const units = ["KB", "MB", "GB"];
    //const units = ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    let u = -1;

    do {
      bytes /= 1024;
      ++u;
    } while (Math.abs(bytes) >= 1024 && u < units.length - 1);

    return bytes.toFixed(1) + " " + units[u];
  }

  // Big thanks to : https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
  /**
   * Invert the given color
   * @param {string} hex Color in the format '#rrggbb' or '#rgb' (or without hash)
   * @param {boolean} [bw] Set to black or white.
   * @returns {string}
   */
  static invertColor(hex, bw) {
    if (hex.indexOf("#") === 0) {
      hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
      throw new Error("Invalid HEX color.");
    }
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);

    if (bw) {
      // http://stackoverflow.com/a/3943023/112731
      return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000000" : "#FFFFFF";
    }
    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + r.padStart(2, "0") + g.padStart(2, "0") + b.padStart(2, "0");
  }

  // https://github.com/lukeed/clsx/blob/master/src/index.js
  // License
  // MIT © Luke Edwards
  /**
   * @private
   * @param {any} mix
   * @returns {string}
   */
  static _toVal(mix) {
    let k,
      y,
      str = "";

    if (typeof mix === "string" || typeof mix === "number") {
      str += mix;
    } else if (typeof mix === "object") {
      if (Array.isArray(mix)) {
        for (k = 0; k < mix.length; k++) {
          if (mix[k]) {
            if ((y = Iob._toVal(mix[k]))) {
              str && (str += " ");
              str += y;
            }
          }
        }
      } else {
        for (k in mix) {
          if (mix[k]) {
            str && (str += " ");
            str += k;
          }
        }
      }
    }

    return str;
  }

  // https://github.com/lukeed/clsx/blob/master/src/index.js
  // License
  // MIT © Luke Edwards
  /**
   * Convert any object to a string with its values.
   * @returns {string}
   */
  static clsx() {
    let i = 0;
    let tmp;
    let x;
    let str = "";
    while (i < arguments.length) {
      if ((tmp = arguments[i++])) {
        if ((x = Iob._toVal(tmp))) {
          str && (str += " ");
          str += x;
        }
      }
    }
    return str;
  }
  static createTheme(name = "") {
    const themeName = Iob.getThemeName(name);
    let theme = store.$theme(themeName);
    //    theme = responsiveFontSizes(theme);
    Iob.setStore.setTheme(Object.assign({}, theme));
    Iob.setStore.setThemeName(themeName);
    //    console.log("CreatedTheme", theme, themeName);
    return (store.$curTheme = theme);
  }

  static get getTheme() {
    return store.$curTheme || Iob.createTheme();
  }

  /**
   * Get the current theme name (either from local storage or the browser settings).
   * @param {string} [themeName]
   * @returns {string}
   */
  static getThemeName(nThemeName = "") {
    const themeName = Iob.getStore.themeName;
    return nThemeName
      ? nThemeName
      : themeName
      ? themeName
      : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "colored";
  }
  static toggleTheme(themeName) {
    themeName = themeName || Iob.getStore.themeName;

    const newThemeName =
      themeName === "dark"
        ? "blue"
        : themeName === "blue"
        ? "colored"
        : themeName === "colored"
        ? "light"
        : themeName === "light"
        ? "dark"
        : "colored";

    Iob.createTheme(newThemeName);

    return newThemeName;
  }

  /**
   * Parse a query string into its parts.
   * @param {string} query
   * @returns {Record<string, string | boolean | number>}
   */
  static parseQuery(query) {
    query = (query || "").toString().replace(/^\?/, "");
    /** @type {Record<string, string | boolean | number>} */
    const result = {};
    query.split("&").forEach((part) => {
      part = part.trim();
      if (part) {
        const parts = part.split("=");
        const attr = decodeURIComponent(parts[0]).trim();
        if (parts.length > 1) {
          result[attr] = decodeURIComponent(parts[1]);
          if (result[attr] === "true") {
            result[attr] = true;
          } else if (result[attr] === "false") {
            result[attr] = false;
          } else {
            const f = parseFloat(result[attr]);
            if (f.toString() === result[attr]) {
              result[attr] = f;
            }
          }
        } else {
          result[attr] = true;
        }
      }
    });
    return result;
  }

  /**
   * Returns parent ID.
   * @param {string} id
   * @returns {string | null} parent ID or null if no parent
   */
  static getParentId(id) {
    const p = (id || "").toString().split(".");
    if (p.length > 1) {
      p.pop();
      return p.join(".");
    } else {
      return null;
    }
  }
}

if (!store.$Iob) store.$Iob = Iob;
if (!store.$curTheme) store.$curTheme = Iob.createTheme();

Iob.setStore.setWidth(Iob.getWidth);

window.addEventListener("resize", Iob.onResize, true);

const notFoundI18n = Iob.notFoundI18n,
  i18n = Iob.i18n,
  styles = Iob.styles,
  t = Iob.t,
  timeStamp = Iob.timeStamp,
  initI18n = Iob.initI18n,
  changeLanguage = Iob.changeLanguage,
  isPartOf = Iob.isPartOf,
  makeFunction = Iob.makeFunction,
  enqueueSnackbar = Iob.enqueueSnackbar,
  closeSnackbar = Iob.closeSnackbar,
  logSnackbar = Iob.logSnackbar,
  copyToClipboard = Iob.copyToClipboard,
  type = Iob.type;

export {
  t,
  type,
  copyToClipboard,
  enqueueSnackbar,
  closeSnackbar,
  logSnackbar,
  initI18n,
  isPartOf,
  timeStamp,
  notFoundI18n,
  makeFunction,
  changeLanguage,
  ioBroker,
  store,
  connect,
  Iob,
  styles,
};

export default store.$Iob;
