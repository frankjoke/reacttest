import React from "react";
import I18n from "@iobroker/adapter-react/i18n";
import I18next from "i18next";
import store, { ioBroker, connect, bindActionCreators } from "../store/ioBroker";
import { saveAs } from "file-saver";
import Utils from "@iobroker/adapter-react/Components/Utils";
import { Tooltip, Button, Icon, Grid, useScrollTrigger, Zoom, Fab } from "@material-ui/core";

//import Iob from "./components/Iob"

store.$i18n = store.$i18n || I18next.createInstance();
store.$notFoundI18n = store.$notFoundI18n || {};
store.$I18n = store.$I18n || I18n;
store.$connection = store.$connection || null;
store.$events = store.$events || new EventTarget();
//console.log("events:", store.$events);
class Iob {
  static boundActionCreators = bindActionCreators(ioBroker.actions, store.dispatch);
  static connect = connect;
  static store = store;
  static ioBroker = ioBroker;

  static notFoundI18n = store.$notFoundI18n;
  static i18n = store.$i18n;
  static I18n = store.$I18n;

  static events = new EventTarget();

  static get events() {
    return store.$events;
  }

  static emitEvent(type, message) {
    const e = new Event(type);
    e.message = message;
    store.$events.dispatchEvent(e);
  }

  static set app(app) {
    store.$app = app;
  }

  static get app() {
    return store.$app;
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

  static t(text, ...args) {
    if (Array.isArray(text)) return text.map((i) => Iob.t(i, ...args));
    if (text.startsWith("!")) text = text.slice(1);
    else {
      const ntext = Iob.i18n.t(text, args.length == 1 && Iob.type(args[0]).object ? args[0] : args);
      if (ntext && ntext != text) text = ntext;
      else {
        //        console.log("Translate not found:", text, ntext, args);
        Iob.notFoundI18n[text] ? ++Iob.notFoundI18n[text] : (Iob.notFoundI18n[text] = 1);
      }
    }

    if (args.length)
      while (text.indexOf("%s") >= 0) {
        text = text.replace("%s", args.shift() || "");
      }
    return text;
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

  static timeStamp(ts) {
    function digits(v, p) {
      p = p || 2;
      v = v.toString();
      while (v.length < p) v = "0" + v;
      return v;
    }
    const d = new Date(ts);
    return `${digits(d.getHours())}:${digits(d.getMinutes())}:${digits(
      d.getSeconds()
    )}.${digits(d.getMilliseconds(), 3)}`;
  }

  static initI18n(lang) {
    if (!lang) lang = Iob.I18n.getLanguage() || "en";
    const options = {
      lng: lang || "en",
      fallbackLng: "en",
      ns: [],
      /*         saveMissing: true,
      missingKeyHandler: (lng, ns, key, fallbackValue) => {
        notFoundI18n[key] ? ++notFoundI18n[key] : (notFoundI18n[key] = 1);

        console.log("i18n:missing", lng, ns, key, fallbackValue, notFoundI18n);
      },
*/ initImmediate: false,
      supportedLngs: Object.keys(Iob.I18n.translations),
      keySeparator: false,
      nsseparator: false,
      //          debug: true,
    };
    //    console.log("i18n options:", options);
    return (
      Iob.i18n
        .init(options)
        .then(() => Iob.addLanguageData("en", Iob.I18n.translations.en), true, true)
        .then(() =>
          lang && lang != "en" && Iob.I18n.translations[lang]
            ? Iob.addLanguageData(lang, Iob.I18n.translations[lang])
            : console.log("Cannot load to add other language:", lang)
        )
        //    .then(() => i18n.reloadResources(null, "translations"))
        .catch((err) => console.log("something went wrong loading i18n", err))
      // .then(() => {
      //   console.log("after i18n init:", Iob.t("key")); // -> same as i18next.t
      // })
    );
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
      conn._socket.emit(cmd, ...args, (err, result) => (err ? reject(err) : resolve(result)))
    );
  }

  static sendTo(instance, command, data) {
    const conn = store.$connection;
    if (!conn || !conn.connected) return Promise.reject(NOT_CONNECTED);
    instance = instance || Iob.getStore.adapterInstance;
    return new Promise((resolve) =>
      conn._socket.emit("sendTo", instance, command, data, (result) => resolve(result))
    );
  }

  static addLanguageData(lng, translation) {
    if (typeof Iob.i18n.addResourceBundle === "function")
      Iob.i18n.addResourceBundle(lng, "translation", translation, true, true);
  }

  static changeLanguage(lng = "en") {
    if (lng != "en" && Iob.I18n.translations[lng]) {
      return Promise.resolve(Iob.addLanguageData(lng, Iob.I18n.translations[lng]), true, true)
        .then(() => {
          Iob.i18n.changeLanguage(lng);
          Iob.setStore.setaDisplayLanguage(lng);
        })
        .catch((e) => Iob.logSnackbar("info;language changed to {0}", [lng]));
    }
    return Promise.reject(`Could not load i18n language ´${lng}´!`);
  }

  static mergeTranslations(translations = {}) {
    const tansI18n = Iob.I18n.translations;
    const curLng = Iob.getStore.displayLanguage;
    Object.keys(translations).forEach((lang) => {
      const ntrans = (tansI18n[lang] = Object.assign(tansI18n[lang], translations[lang]));
      if (lang == curLng || lang == "en") Iob.addLanguageData(lang, ntrans);
    });
  }

  static mergeCombinedTranslation(translations = {}) {
    const tansI18n = Iob.I18n.translations;
    const ntrans = {};
    for (const key of Object.keys(translations))
      for (const lng of Object.keys(translations[key])) {
        if (!ntrans[lng]) ntrans[lng] = {};
        ntrans[lng][key] = translations[key][lng];
      }
    return Iob.mergeTranslations(ntrans);
  }

  static saveFile(what, opts, e) {
    let { mime = "text/plain", name = "filename", stringify = false, ending = ".txt" } = opts || {};

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
      Iob.copyToClipboad(what);
      Iob.logSnackbar("success;copied text to clipboard");
      return false;
    }

    const blob = new Blob([what], {
      type: mime + ";charset=utf-8",
    });

    //      console.log(name, prepend, value, typ, str);
    return saveAs(blob, name + ending);
  }

  static makeFunction(from, that, ...args) {
    that = that || store.$app;

    if (typeof from == "function") return from;
    // else if (Array.isArray(rule)) {
    //   rule = rule.map(i => i.trim());
    else if (typeof from == "object") {
      if (typeof from.regexp == "string") {
        const m = from.regexp.match(/^\/(.*)\/([gimy]*)$/);
        const re = m ? new RegExp(...m.slice(1, 3)) : null;
        let f;
        let r = t(from.message);
        if (re) {
          f = (v) => {
            if (Array.isArray(v)) v = v.slice(-1)[0];
            return !!(v || "").match(re) || r;
          };
        } else {
          f = (v) => {
            if (Array.isArray(v)) v = v.slice(-1)[0];
            // console.log(v);
            return (v || "").indexOf(from.regexp) >= 0 || r;
          };
        }
        return f.bind(that);
      }
    } else if (typeof from == "string" && from.trim()) {
      if (typeof that[from] == "function") return that[from].bind(that);
      from = [...args, from.trim()];
      try {
        let b = from[from.length - 1];
        b = b.startsWith("return ") || b.startsWith("{") ? b : `return ${b};`;
        from[from.length - 1] = b;
        /*         const t = t;
        const React = React;
 */ const f = new Function(...from);
        return f.bind(that);
      } catch (e) {
        console.log(`makeFunction error ${e} in function generation with: ${from}`);
        Iob.logSnackbar("error;makeFunction error %s in function generation with: %s", e, from);
      }
    } else console.log("makeFunction - Invalid function content in rule:", from);
    return null;
  }

  static customFilter(item, queryText /* , itemText */) {
    function find(item, text) {
      if (typeof item === "number") item = item.toString();
      if (typeof item === "string") {
        item = item.toLowerCase();
        if (item.indexOf(text) > -1) return true;
      }
      if (typeof item === "object")
        for (const [i, v] of Object.entries(item)) if (find(v, text)) return true;
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

  static ScrollTop(props) {
    const { children, window } = props;
    const trigger = useScrollTrigger({
      target: window ? window() : undefined,
      disableHysteresis: true,
      threshold: 100,
    });
    return (
      <Zoom in={trigger}>
        <Fab
          color="secondary"
          size="small"
          aria-label="scroll back to top"
          href="#top"
          style={{
            margin: 0,
            top: "auto",
            right: 10,
            bottom: 5,
            left: "auto",
            position: "fixed",
            cursor: "pointer",
          }}
        >
          <Icon>keyboard_arrow_up</Icon>
        </Fab>
      </Zoom>
    );
  }

  static splitProps(from, list) {
    list = typeof list == "string" ? list.split("|") : list || [];
    from = from || {};
    const items = {};
    const split = {};

    Object.keys(from).map((item) => {
      if (list.indexOf(item) >= 0) split[item] = from[item];
      else items[item] = from[item];
    });

    return { items, split };
  }

  static defaultProps(props, def) {
    return Object.assign({}, def, props);
  }

  static isPartOf(val, list) {
    if (!Array.isArray(list)) {
      if (typeof list !== "string") return false;
      list = list.split("|");
    }
    return list.indexOf(val) >= 0;
  }

  static enqueueSnackbar(message, opts) {
    return store.$snackbarProvider.enqueueSnackbar(message, opts);
  }

  static closeSnackbar(message, opts) {
    return store.$snackbarProvider.closeSnackbar(message, opts);
  }

  static logSnackbar(text, ...args) {
    const st = text.split(";");
    let variant = undefined;
    if (st.length > 1) {
      text = st.slice(1).join(";");
      variant = st[0].trim().toLowerCase();
    }
    const options = { variant };
    text = Iob.t(text, ...args);
    if (variant == "error") {
      options.autoHideDuration = 20000;
      console.log("logSnackbar", variant, text);
    }
    Iob.enqueueSnackbar(text, options);
  }

  static copyToClipboad(text) {
    if (typeof text !== "string") text = !text ? "" : JSON.stringify(text);
    Utils.copyToClipboard(text);
    return text;
  }

  static _findStateName(name) {
    const store = Iob.getStore;
    if (name.startsWith(".")) name = store.adapterInstance + name;
    let state = store.adapterStates[name];
    if (!state) {
      name = "system.adapter." + name;
      state = store.adapterStates[name];
    }
    return {state, name: state ? name : ""};
  }

  static getStateValue(oname) {
    const { state } = Iob._findStateName(oname); 
//    console.log("getStateValue", name, state);
    return state && state.val;
  }

  static setStateValue(oname, value) {
    const {state, name } = Iob._findStateName(oname);
    if (state) Iob.commandSend("setState", name, value);
  }

  static styles(theme) {
    const light = theme.palette.type === "light";
    const bottomLineColor = light ? "rgba(0, 0, 0, 0.42)" : "rgba(255, 255, 255, 0.7)";

    return {
      root: {},

      inputRoot: {
        display: "inline-flex",
        flexWrap: "wrap",
        flex: 1,
        marginTop: 0,
        minWidth: 70,
        "&$outlined,&$filled": {
          boxSizing: "border-box",
        },
        "&$outlined": {
          paddingTop: 14,
        },
        "&$filled": {
          paddingTop: 28,
        },
      },
      input: {
        display: "inline-block",
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        appearance: "none", // Remove border in Safari, doesn't seem to break anything in other browsers
        WebkitTapHighlightColor: "rgba(0,0,0,0)", // Remove mobile color flashing (deprecated style).
        float: "left",
        flex: 1,
      },
      chipContainer: {
        display: "flex",
        flexFlow: "row wrap",
        cursor: "text",
        marginBottom: -2,
        minHeight: 40,
        "&$labeled&$standard": {
          marginTop: 18,
        },
      },
      outlined: {
        "& input": {
          height: 16,
          paddingTop: 4,
          paddingBottom: 12,
          marginTop: 4,
          marginBottom: 4,
        },
      },
      standard: {},
      filled: {
        "& input": {
          height: 22,
          marginBottom: 4,
          marginTop: 4,
          paddingTop: 0,
        },
        "$marginDense & input": {
          height: 26,
        },
      },
      labeled: {},
      label: {
        top: 4,
        "&$outlined&:not($labelShrink)": {
          top: 2,
          "$marginDense &": {
            top: 5,
          },
        },
        "&$filled&:not($labelShrink)": {
          top: 15,
          "$marginDense &": {
            top: 20,
          },
        },
      },
      labelShrink: {
        top: 0,
      },
      helperText: {
        marginBottom: -20,
      },
      focused: {},
      disabled: {},
      underline: {
        "&:after": {
          borderBottom: `2px solid ${theme.palette.primary[light ? "dark" : "light"]}`,
          left: 0,
          bottom: 0,
          // Doing the other way around crash on IE 11 "''" https://github.com/cssinjs/jss/issues/242
          content: '""',
          position: "absolute",
          right: 0,
          transform: "scaleX(0)",
          transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.shorter,
            easing: theme.transitions.easing.easeOut,
          }),
          pointerEvents: "none", // Transparent to the hover style.
        },
        "&$focused:after": {
          transform: "scaleX(1)",
        },
        "&$error:after": {
          borderBottomColor: theme.palette.error.main,
          transform: "scaleX(1)", // error is always underlined in red
        },
        "&:before": {
          borderBottom: `1px solid ${bottomLineColor}`,
          left: 0,
          bottom: 0,
          // Doing the other way around crash on IE 11 "''" https://github.com/cssinjs/jss/issues/242
          content: '"\\00a0"',
          position: "absolute",
          right: 0,
          transition: theme.transitions.create("border-bottom-color", {
            duration: theme.transitions.duration.shorter,
          }),
          pointerEvents: "none", // Transparent to the hover style.
        },
        "&:hover:not($disabled):not($focused):not($error):before": {
          borderBottom: `2px solid ${theme.palette.text.primary}`,
          // Reset on touch devices, it doesn't add specificity
          "@media (hover: none)": {
            borderBottom: `1px solid ${bottomLineColor}`,
          },
        },
        "&$disabled:before": {
          borderBottomStyle: "dotted",
        },
      },
      error: {
        "&:after": {
          backgroundColor: theme.palette.error.main,
          transform: "scaleX(1)", // error is always underlined in red
        },
      },
      chip: {
        margin: "0 4px 4px 0",
        float: "left",
      },
      marginDense: {},
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
        width: 350,
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

  static AddIcon(icon, item) {
    return icon ? (
      <React.Fragment>
        <Icon
          component="div"
          style={{
            float: "left",
            width: "28",
            marginTop: "8px",
          }}
        >
          {icon}
        </Icon>
        <div style={{ marginLeft: "32px" }}>{item}</div>
      </React.Fragment>
    ) : (
      item
    );
  }

  static AddTooltip(tooltip, item, key) {
    return (
      (tooltip && (
        <Tooltip key={key} title={tooltip}>
          {item}
        </Tooltip>
      )) ||
      item
    );
  }

  static enableDisableAdapter(what) {
    const id = "system.adapter." + Iob.getStore.adapterInstance;
    const obj = { common: {} };
    if (typeof what == "boolean") {
      obj.common.enabled = !!what;
      Iob.connection.extendObject(id, obj);
    }
  }

  static setLoglevel(what) {
    what = what || Iob.getStore.instanceConfig.common.loglevel;
    const id = "system.adapter." + Iob.getStore.adapterInstance;
    const obj = { common: { loglevel: what } };
    return Iob.connection.extendObject(id, obj);
  }

  static IButton(props) {
    const { tooltip, size, icon, ...passThroughProps } = props;
    const { disabled } = passThroughProps;
    if (disabled) {
      const style = passThroughProps.style || {};
      style.color = "grey";
      passThroughProps.style = style;
    }
    const { onClick } = props;
    const style = onClick ? { style: { cursor: "pointer" } } : {};
    if (size) passThroughProps.fontSize = size;
    const sw = (
      <Icon {...style} {...passThroughProps}>
        {icon}
      </Icon>
    );
    return (disabled && sw) || Iob.AddTooltip(tooltip, sw);
  }

  static TButton(props) {
    const { tooltip, disabled, narrow, icon, startIcon, endIcon, ...passThroughProps } = props;
    passThroughProps.disabled = disabled;
    const label = passThroughProps.label;
    const nprops = Iob.defaultProps(passThroughProps, {
      size: "medium",
      "aria-label": label ? label : "Delete",
    });
    const iFontSize = nprops.size == "small" || nprops.size == "large" ? nprops.size : "default";
    if (startIcon)
      nprops.startIcon =
        typeof startIcon === "string" ? <Icon fontSize={iFontSize}>{startIcon}</Icon> : startIcon;
    else if (icon)
      nprops.startIcon = typeof icon === "string" ? <Icon fontSize={iFontSize}>{icon}</Icon> : icon;
    else if (endIcon)
      nprops.endIcon =
        typeof endIcon === "string" ? <Icon fontSize={iFontSize}>{endIcon}</Icon> : endIcon;
    const sw = <Button {...nprops}>{!narrow ? label : null}</Button>;
    return (disabled && sw) || Iob.AddTooltip(tooltip, sw);
  }
}

if (!store.$Iob) store.$Iob = Iob;

const notFoundI18n = Iob.notFoundI18n,
  i18n = Iob.i18n,
  styles = Iob.styles,
  t = Iob.t,
  timeStamp = Iob.timeStamp,
  initI18n = Iob.initI18n,
  changeLanguage = Iob.changeLanguage,
  splitProps = Iob.splitProps,
  defaultProps = Iob.defaultProps,
  isPartOf = Iob.isPartOf,
  makeFunction = Iob.makeFunction,
  enqueueSnackbar = Iob.enqueueSnackbar,
  closeSnackbar = Iob.closeSnackbar,
  logSnackbar = Iob.logSnackbar,
  copyToClipboad = Iob.copyToClipboad,
  type = Iob.type;

export {
  t,
  type,
  copyToClipboad,
  enqueueSnackbar,
  closeSnackbar,
  styles,
  splitProps,
  defaultProps,
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
};

export default store.$Iob;
