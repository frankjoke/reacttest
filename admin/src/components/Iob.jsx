import React from "react";
import I18n from "@iobroker/adapter-react/i18n";
import I18next from "i18next";
import store, { ioBroker } from "../store/ioBroker";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { useSnackbar } from "notistack";
import Utils from "@iobroker/adapter-react/Components/Utils";
import { Tooltip, Button, Icon, Grid, useScrollTrigger, Zoom, Fab } from "@material-ui/core";

//import Iob from "./components/Iob"

store.$snackbarProvider = {
  enqueueSnackbar: (message, opts) =>
    console.log("enqueueSnackbar not defined yet!", message, opts),

  closeSnackbar: (message, opts) => console.log("closeSnackbar not defined yet!", message, opts),
};

store.$i18n = store.$i18n || I18next.createInstance();
store.$notFoundI18n = store.$notFoundI18n || {};
store.$I18n = store.$I18n || I18n;
store.$connection = null;
class Iob {
  static boundActionCreators = bindActionCreators(ioBroker.actions, store.dispatch);
  static connect = connect;
  static store = store;
  static ioBroker = ioBroker;

  static notFoundI18n = store.$notFoundI18n;
  static i18n = store.$i18n;
  static I18n = store.$I18n;

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
      const ntext = Iob.i18n.t(
        text,
        args.length == 1 && Iob.type(args[0]).object ? args[0] : args
      );
      if (ntext && ntext != text) text = ntext;
      else {
        //        console.log("Translate not found:", text, ntext, args);
        Iob.notFoundI18n[text] ? ++Iob.notFoundI18n[text] : (Iob.notFoundI18n[text] = 1);
      }
    }

    if (args.length)
      while (text.indexOf("%s")>=0) {
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
    const res = { typeof: typeof obj, class: getAnyClass(obj)};
    if (res.class === "null" || res.class === "undefined")
      res.empty=true;
    else {
      if (Array.isArray(obj))
        res.typeof = "array";
      res[res.typeof] = true;
    }
    return res;
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
        .then(
          () => Iob.addLanguageData("en", Iob.I18n.translations.en),
          true,
          true
        )
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



  static addLanguageData(lng, translation) {
      if (typeof Iob.i18n.addResourceBundle === "function")
        Iob.i18n.addResourceBundle(lng, "translation", translation, true, true);        
  }

  static changeLanguage(lng = "en") {
    if (lng != "en" && Iob.I18n.translations[lng]) {
      return Promise.resolve(
        Iob.addLanguageData(lng, Iob.I18n.translations[lng]),
        true,
        true
      )
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
    Object.keys(translations).forEach(
      (lang) => {
        const ntrans = tansI18n[lang] = Object.assign(tansI18n[lang], translations[lang]);
        if (lang == curLng || lang == "en")
        Iob.addLanguageData(lang, ntrans);
      }
    );
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

  static MySnackbar() {
    store.$snackbarProvider = useSnackbar();
    return null;
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
      <Grid container spacing={1} alignItems="center" justify="flex-start">
        <Grid item>
          <Icon>{icon}</Icon>
        </Grid>
        <Grid item>{item}</Grid>
      </Grid>
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
    const obj = /* this.adapterDebugLevel
      ? {
          common: {
            loglevel: this.adapterDebugLevel,
          },
        }
      : */ { common: {} };
    if (typeof what == "boolean") obj.common.enabled = !!what;
        return Iob.connection.extendObject(id, obj);
  }

  static IButton(props) {
    const { tooltip, size, icon, ...passThroughProps } = props;
    const { disabled } = passThroughProps;
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
    const { tooltip, disabled, narrow, icon, ...passThroughProps } = props;
    passThroughProps.disabled = disabled;
    const label = passThroughProps.label;
    const startIcon = typeof icon === "string" ? <Icon>{icon}</Icon> : icon;
    const nprops = Iob.defaultProps(passThroughProps, {
      size: "medium",
      "aria-label": label ? label : "Delete",
      startIcon,
    });
    const sw = <Button {...nprops}>{!narrow ? label : null}</Button>;
    return (disabled && sw) || Iob.AddTooltip(tooltip, sw);
  }
}

class HtmlComponent extends React.Component {
  constructor(props) {
    super(props);
    this.divRef = React.createRef();
    const { html, ...rest } = props;
    this.myHTML = html;
    this.rest = rest;
  }

  componentDidMount() {
    this.divRef.current.innerHTML = this.myHTML;
  }

  render() {
    return <div ref={this.divRef} {...this.rest}></div>;
  }
}

Iob.HtmlComponent = HtmlComponent;

if (!store.$Iob)
  store.$Iob = Iob;

const notFoundI18n = Iob.notFoundI18n,
  i18n = Iob.i18n,
  styles = Iob.styles,
  t = Iob.t,
  initI18n = Iob.initI18n,
  changeLanguage = Iob.changeLanguage,
  splitProps = Iob.splitProps,
  defaultProps = Iob.defaultProps,
  isPartOf = Iob.isPartOf,
  enqueueSnackbar = Iob.enqueueSnackbar,
  closeSnackbar = Iob.closeSnackbar,
  logSnackbar = Iob.logSnackbar,
  copyToClipboad = Iob.copyToClipboad,
  MySnackbar = Iob.MySnackbar,
  type = Iob.type;

export {
  t,
  type,
  copyToClipboad,
  MySnackbar,
  enqueueSnackbar,
  closeSnackbar,
  styles,
  splitProps,
  defaultProps,
  logSnackbar,
  initI18n,
  isPartOf,
  notFoundI18n,
  changeLanguage,
  bindActionCreators,
  ioBroker,
  store,
  connect,
  HtmlComponent,
  Iob,
};

export default store.$Iob;
