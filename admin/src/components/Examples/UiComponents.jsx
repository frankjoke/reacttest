import React, { useState } from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Dropzone from "react-dropzone";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
import cx from "classnames";
import { Iob, t, styles } from "./Iob";
import {
  FormHelperText,
  FormControl,
  InputAdornment,
  IconButton,
  Button,
  Input,
  InputLabel,
  Icon,
  Tooltip,
  useScrollTrigger,
  Zoom,
  Fab,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import Autocomplete, {
  createFilterOptions,
} from "@material-ui/lab/Autocomplete";
//import { LinkedErrors } from "@sentry/browser/dist/integrations";
//import { config } from "chai";
//import { isNotEmittedStatement } from "typescript";
import PropTypes from "prop-types";
import { useDrop, useDrag } from "react-dnd";
/**
 * @typedef {object} LoaderProps
 * @property {string} [key] The key to identify this component.
 * @property {number} [size] The size in pixels of this loader.
 * @property {string} [themeType] The chosen theme type.
 * @property {string} [theme] The chosen theme.
 *
 * @extends {React.Component<LoaderProps>}
 */
class Loader extends React.Component {
  /**
   * @param {LoaderProps} props
   */
  constructor(props) {
    super(props);
    this.size = this.props.size || 234;
  }

  render() {
    const theme = this.props.themeType || this.props.theme || "light";
    return (
      <div
        key={this.props.key}
        className={"logo-back logo-background-" + theme}
      >
        <div
          className="logo-div"
          style={{ width: this.size, height: this.size }}
        >
          <div
            className={"logo-top logo-background-" + theme}
            style={{ left: "37%" }}
          />
          <div
            className={"logo-top logo-background-" + theme}
            style={{ left: "57%" }}
          />
          <div
            className={
              "logo-border logo-background-" + theme + " logo-animate-wait"
            }
            style={{ borderWidth: this.size * 0.132 }}
          />
          <div className={"logo-i logo-animate-color-inside-" + theme} />
          <div
            className={"logo-i-top logo-animate-color-inside-" + theme}
            style={{ top: "18%" }}
          />
          <div
            className={"logo-i-top logo-animate-color-inside-" + theme}
            style={{ bottom: "18%" }}
          />
        </div>
        <div
          className={"logo-animate-grow logo-animate-grow-" + theme}
          style={{ width: this.size + 11, height: this.size + 11 }}
        />
      </div>
    );
  }
}

Loader.propTypes = {
  key: PropTypes.string,
  size: PropTypes.number,
  themeType: PropTypes.string,
};

/** @type {typeof Loader} */
const _exportLoader = withStyles(styles)(Loader);

function AddIcon(icon, item) {
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

function MakeDroppable({
  dropZone = "",
  dropAction,
  canDropHere = () => true,
  isOverProps = { style: { backgroundColor: "#C6F6C6" } },
  children,
  ...props
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: dropZone,
    drop: (what) =>
      typeof dropAction === "function"
        ? dropAction(what)
        : Iob.logSnackbar(
            "warning;no drop action defined for {0} with value {1}",
            dropZone,
            JSON.stringify(what)
          ),
    canDrop: (what) => canDropHere(what),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });
  if (isOver) props = Object.assign({}, props, isOverProps);
  if (isOver && !canDrop) {
    console.log(isOver, canDrop, props);
    const style = Object.assign({}, props.style || {});
    Object.assign(style, { backgroundColor: "pink" });
    props.style = style;
  }
  return (
    <div ref={drop} {...props}>
      {children}
    </div>
  );
}

function MakeDraggable({ dragValue, dropZone = "", children }) {
  const [{ isDragging }, drag] = useDrag({
    item: { type: dropZone, dropped: dragValue },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: "move" }}>
      {children}
    </div>
  );
}

function AutocompleteSelect(props) {
  function ri(inputProps) {
    return <TextField {...inputProps} margin="normal" />;
  }
  function getOlabel(option) {
    const found = options.find((i) => i.value == option);
    //    console.log(option, found, options);
    if (typeof option === "string" && found) return found.label;
    return option.label;
  }

  const { inputProps, getOptionLabel = getOlabel, onChange, ...rest } = props;
  let { renderInput = ri, options = { "": "" }, ...defaultProps } = rest;
  if (typeof options === "string") {
    const opt = options
      .split("|")
      .map((i) => ({ label: i.trim(), value: i.trim() }));
    options = opt;
  }
  //  console.log(defaultProps, onChange);
  return (
    <Autocomplete
      {...defaultProps}
      getOptionSelected={(option, value) => option.value == value}
      getOptionLabel={getOptionLabel}
      renderInput={renderInput}
      options={options}
      onChange={(e, option) => onChange && onChange(e, option.value)}
    />
  );
}

class InputField extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    this.key = props.id + "-" + props.label;
    this.state = { showPasswd: false };
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }

  render() {
    const {
      hint = "",
      value,
      label = "",
      endAdornment = null,
      startAdornment = null,
      type = "text",
      inputProps = {},
      errorString = "",
      rules = [],
      disabled = false,
      margin = "dense",
      size = "small",
      required = false,
      ...more
    } = this.props;
    const { showPasswd } = this.state;
    let nerror = !!errorString,
      nerrorString = errorString;
    //    if (Array.isArray(rules) && rules.length) debugger;
    if (typeof rules === "function") nerrorString = rules(value, t);
    else if (Array.isArray(rules))
      for (const rule of rules)
        if (typeof rule === "function") {
          const res = rule(value, t);
          if (res !== true) {
            nerrorString = res;
            break;
          }
        }
    nerror = typeof nerrorString === "string" && !!nerrorString;
    //    console.log(hint, nerror, nerrorString);
    const helperText = nerror && nerrorString ? nerrorString : hint;
    const iae =
      type == "password" ? (
        <InputAdornment position="end">
          <IconButton
            aria-label="toggle password visibility"
            onClick={(e) => this.setState({ showPasswd: !showPasswd })}
            onMouseDown={(e) => e.preventDefault()}
          >
            {showPasswd ? <Icon>visibility_off</Icon> : <Icon>visibility</Icon>}
          </IconButton>
        </InputAdornment>
      ) : (
        endAdornment
      );
    return (
      <FormControl
        {...{ required, size, margin, disabled }}
        hiddenLabel={!label}
        error={nerror}
      >
        <InputLabel htmlFor={this.key}>{label}</InputLabel>
        <Input
          value={value}
          id={this.key}
          onChange={(e) =>
            typeof this.props.onChange === "function"
              ? this.props.onChange(e)
              : null
          }
          endAdornment={
            iae && typeof iae === "string" ? (
              <InputAdornment position="end">{iae}</InputAdornment>
            ) : (
              iae
            )
          }
          startAdornment={
            startAdornment && typeof startAdornment === "string" ? (
              <InputAdornment position="start">{startAdornment}</InputAdornment>
            ) : (
              startAdornment
            )
          }
          type={showPasswd ? "text" : type}
          {...more}
          {...inputProps}
        />
        {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
      </FormControl>
    );
  }
}

function IButton(props) {
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
  return (disabled && sw) || AddTooltip(tooltip, sw);
}

function TButton(props) {
  const {
    tooltip,
    disabled = false,
    narrow,
    icon,
    startIcon,
    endIcon,
    label,
    size = "medium",
    ...passThroughProps
  } = props;
  const nprops = {
    size,
    disabled,
    "aria-label": label ? label : "",
    ...passThroughProps,
  };
  const iFontSize =
    nprops.size == "small" || nprops.size == "large" ? nprops.size : "default";
  if (startIcon)
    nprops.startIcon =
      typeof startIcon === "string" ? (
        <Icon fontSize={iFontSize}>{startIcon}</Icon>
      ) : (
        startIcon
      );
  else if (icon)
    nprops.startIcon =
      typeof icon === "string" ? (
        <Icon fontSize={iFontSize}>{icon}</Icon>
      ) : (
        icon
      );
  else if (endIcon)
    nprops.endIcon =
      typeof endIcon === "string" ? (
        <Icon fontSize={iFontSize}>{endIcon}</Icon>
      ) : (
        endIcon
      );
  const sw = <Button {...nprops}>{!narrow ? label : null}</Button>;
  return (disabled && sw) || AddTooltip(tooltip, sw);
}

function AddTooltip(tooltip, item, key) {
  return (
    (tooltip && (
      <Tooltip key={key} title={tooltip}>
        {item}
      </Tooltip>
    )) ||
    item
  );
}

function AddTooltipChildren({ tooltip, children, ...props }) {
  return (
    (tooltip && (
      <Tooltip title={tooltip} {...props}>
        {children}
      </Tooltip>
    )) ||
    children
  );
}

function ScrollTop(props) {
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

class LoadButton extends React.Component {
  constructor(props) {
    super(props);
    const {
      receivedFile = (f) => f,
      tooltip = "",
      isOver = "",
      dropLabel = "drop here",
      dropStyle = { color: "black" },
      ...items
    } = props;
    this.state = {
      receivedFile,
      tooltip,
      dropLabel,
      dropStyle,
      items,
      isOver,
      receivedFile,
    };
    //    this.id = props.label + props.icon + props.endIcon;
  }

  /*   static getDerivedStateFromProps(props, state) {
    let newState = null;
    //    console.log("derivedState:", state.opvalue, props.value, state.value);
    if (props.value != state.opvalue) {
      //      console.log("Prop value changed!", state.opvalue, props.value, state.value);
      newState = { value: props.value, opvalue: props.value };
    }
    return newState;
  }
 */
  loadTextFromFile(files) {
    this.setState({ isOver: false });
    if (!files.length) return;
    const file = files[0];
    //    console.log("onDrop Files:", files, file);
    const reader = new FileReader();
    reader.onload = (e) => {
      let r = e.target.result;
      this.state.receivedFile(r, file.path);
    };
    reader.readAsText(file);
  }

  render() {
    const { isOver, items, dropLabel, dropStyle } = this.state;
    const { label, narrow, icon, startIcon, endIcon, ...props } = Object.assign(
      {},
      items
    );
    //    if (isOver) props.color = "secondary";
    //    console.log(props);
    const iFontSize =
      props.size == "small" || props.size == "large" ? props.size : "default";
    if (startIcon)
      props.startIcon =
        typeof startIcon === "string" ? (
          <Icon fontSize={iFontSize}>{startIcon}</Icon>
        ) : (
          startIcon
        );
    else if (icon)
      props.startIcon =
        typeof icon === "string" ? (
          <Icon fontSize={iFontSize}>{icon}</Icon>
        ) : (
          icon
        );
    else if (endIcon)
      props.endIcon =
        typeof endIcon === "string" ? (
          <Icon fontSize={iFontSize}>{endIcon}</Icon>
        ) : (
          endIcon
        );
    if (isOver) props.title = isOver;
    const dz = (
      <span>
        <Dropzone
          onDrop={(acceptedFiles) => this.loadTextFromFile(acceptedFiles)}
          onDragEnter={() => this.setState({ isOver: dropLabel })}
          onDragLeave={() => this.setState({ isOver: "" })}
          multiple={false}
        >
          {({ getRootProps, getInputProps }) => (
            <React.Fragment>
              <Button
                {...props}
                {...getRootProps({ refKey: "innerRef" })}
                style={isOver ? dropStyle : {}}
              >
                {!narrow && !isOver ? label : isOver}
              </Button>
              <input type="file" style="display: none" {...getInputProps()} />
            </React.Fragment>
          )}
        </Dropzone>
      </span>
    );
    const sw = AddTooltip(this.state.tooltip, dz);
    return sw;
  }
}

class IDialog extends React.Component {
  constructor(props) {
    super(props);
    const { type = "default", options = {}, children, ...rprops } = props;
    this.state = {
      type,
      options: Object.assign(
        {
          title: type + " dialog",
          okIcon: "done",
          okLabel: t("ok"),
          okColor: "primary",
          okTooltip: t("click here to accept data"),
        },
        options
      ),
      open: false,
      show: {},
      value: (options && options.inputValue) || "",
      rprops,
    };
    this.callback = (options && options.callback) || null;
    this.how = false;
    Iob.setDialog(type, (setToShow) => {
      const nstate = { open: !!setToShow };
      if (typeof setToShow === "object" && setToShow !== null) {
        nstate.show = setToShow;
        this.callback =
          typeof setToShow.callback === "function" ? setToShow.callback : null;
        if (setToShow.inputValue && setToShow.inputValue != this.state.vale)
          nstate.value = setToShow.inputValue;
      }
      this.how = false;
      this.setState(nstate);
    });
    //    this.id = props.label + props.icon + props.endIcon;
  }

  handleClose(how, e) {
    this.how = how;
    const { show, options, value } = this.state;
    if (show.inputProps || options.inputProps) if (how) this.how = value;
    //      console.log("dialog close", how, this.how, e);
    this.setState({ open: false });
    //    if (show && show.callback) show.callback(how);
  }

  render() {
    const { type, options, open, show = {}, rprops, value } = this.state;
    const {
      title,
      text,
      cancelIcon,
      okIcon,
      okTooltip,
      cancelTooltip,
      cancelLabel,
      okLabel,
      okColor,
      okOnEnter,
      cancelColor,
      paperProps,
      inputProps,
      inputValue,
    } = Object.assign({}, options, show);
    const id = "idialog-" + type;
    //    console.log(type, open, show, options);
    return (
      <Dialog
        open={open}
        {...rprops}
        onClose={(...e) => this.handleClose(false, e)}
        onEscapeKeyDown={(...e) => this.handleClose(false, e)}
        onExit={(...e) => this.callback && this.callback(this.how)}
        PaperProps={paperProps}
        aria-labelledby={id + "title"}
      >
        {text && <DialogTitle id={id + "title"}>{title}</DialogTitle>}
        <DialogContent>
          {text && <DialogContentText>{text}</DialogContentText>}
          {this.props.children}
          {inputProps && (
            <InputField
              {...inputProps}
              autoFocus
              value={value}
              onKeyUp={(e) =>
                e.key == "Enter" && okOnEnter ? this.handleClose(true, e) : null
              }
              onChange={(e) => this.setState({ value: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions>
          {(okIcon || okLabel) && (
            <TButton
              onClick={(...e) => this.handleClose(true, e)}
              label={okLabel}
              icon={okIcon}
              color={okColor}
              tooltip={okTooltip}
            />
          )}
          {(cancelIcon || cancelLabel) && (
            <TButton
              onClick={(...e) => this.handleClose(false, e)}
              label={cancelLabel}
              icon={cancelIcon}
              color={cancelColor}
              tooltip={cancelTooltip}
            />
          )}
        </DialogActions>
      </Dialog>
    );
  }
}

export {
  InputField,
  _exportLoader as Loader,
  AddIcon,
  IDialog,
  TButton,
  IButton,
  AddTooltip,
  AddTooltipChildren,
  ScrollTop,
  MakeDroppable,
  MakeDraggable,
  LoadButton,
  HtmlComponent,
  AutocompleteSelect,
  styles,
};

export default styles;
