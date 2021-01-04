import React from "react";
import { Tooltip, Button, Icon, Grid } from "@material-ui/core";
import I18n from "@iobroker/adapter-react/i18n";
import cx from "classnames";
//import { resolveModuleNameFromCache } from "typescript";

const notFoundI18n = {};

function t(text, ...rest) {
  if (Array.isArray(text)) return text.map((i) => t(i, ...rest));
  if (text.startsWith("!")) return text.slice(1);
  if (notFoundI18n[text]) {
    ++notFoundI18n[text];
    return text;
  }
  const tt = I18n.t(text, ...rest);
  if (!tt || tt == text)
    if (notFoundI18n[text]) ++notFoundI18n[text];
    else notFoundI18n[text] = 1;
  return tt ? tt : text;
}

const Components = {
  AddIcon(icon, item) {
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
  },

  AddTooltip(tooltip, item, key) {
    return tooltip ? (
      <Tooltip key={key} title={<h3>{tooltip}</h3>}>
        {item}
      </Tooltip>
    ) : (
      item
    );
  },

  IButton(props) {
    const { tooltip, size, icon, ...passThroughProps } = props;
    const { disabled } = passThroughProps;
    const {onClick} = props;
    const style = onClick ? {style:{cursor:"pointer"}} : {};
    if (size) passThroughProps.fontSize = size;
    const sw = <Icon {...style} {...passThroughProps}>{icon}</Icon>;
    return disabled ? sw : Components.AddTooltip(tooltip, sw);
  },

  TButton(props) {
    const { tooltip, disabled, narrow, icon, ...passThroughProps } = props;
    passThroughProps.disabled = disabled;
    const label = passThroughProps.label;
    const startIcon = typeof icon === "string" ? <Icon>{icon}</Icon> : icon;
    const nprops = defaultProps(passThroughProps, {
      size: "medium",
      "aria-label": label ? label : "Delete",
      startIcon,
    });
    const sw = <Button {...nprops}>{!narrow ? label : null}</Button>;
    return disabled ? sw : Components.AddTooltip(tooltip, sw);
  },
};

/**
 * @type {() => Record<string, import("@material-ui/core/styles/withStyles").CreateCSSProperties>}
 */
const styles = (theme) => {
  const light = theme.palette.type === "light";
  const bottomLineColor = light ? "rgba(0, 0, 0, 0.42)" : "rgba(255, 255, 255, 0.7)";

  const res = {
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
      marginRight: 20,
    },
    columnLogo: {
      width: 350,
      marginRight: 0,
    },
    columnSettings: {
      width: "calc(100% - 370px)",
    },
    code: {
      backgroundColor: "pink",
      padding: "2px, 2px",
    },
    controlElement: {
      //background: "#d2d2d2",
      marginBottom: 5,
    },
  };
//  console.log("StyleIC:", theme, res);
  return res;
};

function splitProps(from, list) {
  list = typeof list == "string" ? list.split("|") : list || [];
  from = from || {};
  const nitems = {};
  const split = {};

  Object.keys(from).map((item) => {
    if (list.indexOf(item) >= 0) split[item] = from[item];
    else nitems[item] = from[item];
  });

  return { items: nitems, split };
}

function defaultProps(props, def) {
  return Object.assign({}, def, props);
}

function isPartOf(val, list) {
  if (!Array.isArray(list)) {
    if (typeof list !== "string") return false;
    list = list.split("|");
  }
  return list.indexOf(val) >= 0;
}

export { Components, styles, splitProps, defaultProps, t, isPartOf, notFoundI18n };
