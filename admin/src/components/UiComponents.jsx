import React, { useState, useEffect } from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
//import Dropzone from "react-dropzone";
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
  InputBase,
  InputLabel,
  Icon,
  Tooltip,
  Paper,
  useScrollTrigger,
  Zoom,
  Fab,
  Chip,
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
import "./loader.css";
import PropTypes from "prop-types";
import { DragSource, useDrop, useDrag } from "react-dnd";
import Draggable from "react-draggable";
import { NativeTypes } from "react-dnd-html5-backend";
import { green, pink } from "@material-ui/core/colors";

function useSingleAndDoubleClick(
  actionSimpleClick,
  actionDoubleClick,
  delay = 250
) {
  const [click, setClick] = useState(0);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // simple click
      if (click === 1 && typeof actionSimpleClick === "function")
        actionSimpleClick(event);
      setClick(0);
    }, delay);

    // the duration between this click and the previous one
    // is less than the value of delay = double-click
    if (click === 2 && typeof actionDoubleClick === "function")
      actionDoubleClick(event);

    return () => clearTimeout(timer);
  }, [click]);

  return (e) => {
    setEvent(e);
    setClick((prev) => prev + 1);
  };
}

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

const MakeDroppable = React.forwardRef((dprops, dref) => {
  let {
    dropZone = [],
    dropAction,
    canDropHere = () => true,
    dropOptions = {},
    dropMonitor,
    dropCollect = {},
    dropKey = "",
    isOverProps = { style: { backgroundColor: green[100] } },
    cannotDropProps = { style: { backgroundColor: pink[50] } },
    children,
    ...props
  } = dprops;
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: dropZone,
    drop: (what) => {
      //      console.log("drop", dropZone, what, dropAction);
      typeof dropAction === "function"
        ? dropAction(what)
        : Iob.logSnackbar(
            "warning;no drop action defined for {0} with value {1}",
            dropZone,
            Iob.stringify(what, 1, " ")
          );
    },
    canDrop: (what) => canDropHere(what),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
      ...dropCollect,
    }),
    ...dropOptions,
  });
  function myfW(el = null, options = null) {
    //    console.log(`myFw(${el}, ${options}), ${dref && dref.current}`);
    drop(el, options);
    if (el && dref) dref.current = el;
    //    dref(...Array.from(a));
  }
  dropMonitor &&
    setTimeout(dropMonitor, 10, {
      dropKey,
      isOver,
      canDrop,
      dropZone: isOver && canDrop,
    });
  if (isOver) props = Iob.mergeProps(props, isOverProps);
  if (isOver && !canDrop) props = Iob.mergeProps(props, cannotDropProps);
  return (
    <div ref={myfW} {...props} className="MakeDroppable">
      {children}
    </div>
  );
});

function MakeDraggable(cprops) {
  const {
    dragValue,
    dragCollect,
    dragZone = "",
    dragProps = {},
    dragOptions = {},
    dragTest,
    dragDisable,
    children,
    ...rest
  } = cprops;
  if (!dragZone || dragDisable) return children;
  const child = React.Children.only(children);
  //  console.log(cprops, rest);
  const [dragHandle, drag] = useDrag({
    item: { type: dragZone, ...dragValue },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
      ...dragCollect,
    }),
    ...dragOptions,
  });
  const isDragging = dragHandle.isDragging;
  let props = { ref: drag, ...rest };
  const { onClick, onDoubleClick } = child.props;
  //  console.log(onClick, onDoubleClick);
  if (onDoubleClick)
    props.onClick = useSingleAndDoubleClick(onClick, onDoubleClick);
  dragTest && dragTest({ dragZone, props, isDragging, dragHandle, dragValue });
  //    children.ref = drag;
  //    Object.assign(children.props,dragProps);
  if (isDragging && dragProps) props = Iob.mergeProps(props, dragProps);
  //  console.log(props);
  return <div {...props}>{children}</div>;
  /*   const nchild = React.cloneElement(child, props);
  //  console.log(nchild.type.displayName, nchild.props);
  return nchild;
 */
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

class MyChip extends React.Component {
  constructor(props) {
    super(props);
    const { className, onDelete, dragZone, index, ...rprops } = props;
    this.className = className;
    this.state = { onDelete, dragZone, index, ...rprops };
    //    console.log("myChipC", key, rprops.dropZone);
    //    console.log("MyChip", key, rprops);
  }
  render() {
    const {
      label,
      style,
      size,
      arr,
      onDelete,
      index,
      onChange,
      dragZone,
      dragValue,
      dragProps = { style: { opacity: 0.4, cursor: "move" } },
      dragTest,
      isOverProps,
      canDropHere,
      dragOptions,
      dropAction = (e) => {
        const item = {
          target: { value: Iob.reorder(e.items, e.index, this.state.index) },
        };
        //        console.log("dropAction MyChip", this.state.index, e, item);
        onChange && onChange(item);
      },
      moveChip,
      ...rprops
    } = this.state;
    //    console.log("myChip", this.key, label, dropZone, index);
    const ref = React.createRef();
    const chip = (
      <Chip
        label={label}
        size={size}
        onDelete={(e) => onDelete && onDelete(e, index)}
        {...Iob.mergeProps(rprops, { style: { margin: "1px 1px" } })}
      />
    );
    return !dragZone ? (
      chip
    ) : (
      <MakeDroppable
        ref={ref}
        dropZone={dragZone}
        canDropHere={(e) => e.index != this.state.index}
        dropAction={dropAction}
        isOverProps={isOverProps}
      >
        <MakeDraggable
          dragZone={dragZone}
          dragValue={dragValue}
          dragProps={dragProps}
          dragTest={dragTest}
          dragOptions={dragOptions}
          //        canDropHere={canDropHere}
        >
          {chip}
        </MakeDraggable>
      </MakeDroppable>
    );
  }
}

let cid = 0;
class InputField extends React.Component {
  constructor(props) {
    super(props);
    const {
      classes,
      options,
      id = "inputField" + cid++,
      label,
      error,
      errorString,
      multiple,
      value,
      defaultValue,
      dragZone,
      canRearrange = true,
      type = "text",
      ...rprops
    } = props;
    this.classes = classes;
    this.key = type + "-" + id;
    this.type = type;
    this.myInput = React.createRef();
    const chips = type == "chips";
    if (chips) this.type = "text";
    this.state = {
      id,
      label,
      showPasswd: false,
      inputValue: "",
      //      defaultValue,
      options: InputField.getOptions(options),
      error,
      errorString,
      multiple: chips || multiple || false,
      chips,
      canRearrange,
      value,
    };
    if (!dragZone && chips && canRearrange)
      this.state.dragZone = "chips-drop-" + this.key;
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }

  static getOptions(options) {
    if (Array.isArray(options)) return options;
    if (typeof options === "string") {
      const osplit =
        options.indexOf("|") >= 0 && options.indexOf(";") < 0 ? "|" : ";";
      const isobj = options.indexOf("=") >= 0;
      if (isobj) {
        return options.split(
          osplit.map((i) => {
            let [label, value] = i.split("=").map((j) => j.trim());
            if (!value) value = label;
            return { label, value };
          })
        );
      } else return options.split(osplit).map((i) => i.trim());
    }
    return [];
  }
  static getDerivedStateFromProps(props, state) {
    let newState = null;
    const { value, options, error, errorString } = props;
    //    console.log("derivedState:", state.opvalue, props.value, state.value);
    if (
      value !== state.o_value ||
      options !== state.o_options ||
      error !== state.error ||
      errorString !== state.errorString
    ) {
      //      console.log("Prop value changed!", state.opvalue, props.value, state.value);
      newState = {
        value,
        options: InputField.getOptions(options),
        o_value: value,
        o_options: options,
        error,
        errorString,
      };
    }
    return newState;
  }

  doChange(nval, e, reason) {
    const value = this.state.value;
    if (typeof nval === "object" && nval.value !== undefined) nval = nval.value;
    if (JSON.stringify(value) == JSON.stringify(nval)) return;
    //    console.log("doCHange", nval, value);
    const onChange = this.props.onChange;
    //    this.setState({ value: nval });
    onChange &&
      onChange({
        target: { value: nval, e, reason },
      });
  }

  onChangeInputValue(val) {
    const { inputValue, value, multiple } = this.state;
    //    console.log("onChangeInputValue", this.key, multiple, val, value, inputValue, this.state);
    if (!multiple) return this.doChange(val);
    this.setState({ inputValue: val });
  }
  render() {
    //    if (this.key.indexOf("chips") >= 0) console.log(this.key, this.state);
    let {
      showPasswd,
      inputValue,
      options,
      value,
      chips,
      dragZone,
      canRearrange,
      multiple,
      label,
      id,
      errorString = "",
      error = false,
    } = this.state;
    let rprops;
    if (!rprops) {
      const {
        classes,
        options,
        id,
        label,
        multiple,
        value,
        defaultValue,
        dragZone,
        canRearrange,
        type,
        errorString,
        error,
        ...pprops
      } = this.props;
      rprops = pprops;
    }
    const {
      hint = "",
      endAdornment,
      startAdornment,
      getOptionLabel,
      getOptionSelected,
      noOptionsText = "",
      fullWidth,
      //      inputWidth = "2000px",
      iselect,
      freeSolo,
      dragComponent,
      clickable = true,
      renderInput,
      renderTags,
      disableClearable,
      onChange,
      inputProps = {},
      rules = [],
      disabled = false,
      margin = "dense",
      size = "small",
      required = false,
      width = "auto",
      minWidth = "100px",
      ...more
    } = rprops;
    //    console.log(id, value);
    if (value === undefined || value === null)
      value =
        multiple || chips
          ? Object.isArray(defaultValue)
            ? defaultValue
            : []
          : typeof defaultValue === "string"
          ? defaultValue
          : "";
    const useOptions = Array.isArray(options) && options.length;
    const offsetWidth =
      (this.myInput.current && this.myInput.current.offsetWidth) ||
      window.innerWidth / 4;
    //      console.log(offsetWidth);
    const listStyle = {
      display: "flex",
      flexFlow: "row wrap",
      marginRight: "6px",
      minWidth: minWidth
        ? minWidth
        : offsetWidth
        ? Math.floor(offsetWidth / 3).toString()
        : "30vw",
      //      width: offsetWidth ? Math.floor(offsetWidth/1.4).toString() : "20vw",
      maxWidth: offsetWidth ? Math.floor(offsetWidth / 1.7).toString() : "50vw",
    };
    //    console.log(id, value, this.props.defaultValue);
    let nerror = error || !!errorString,
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
    let iae =
      this.type == "password" ? (
        <IconButton
          aria-label="toggle password visibility"
          onClick={(e) => this.setState({ showPasswd: !showPasswd })}
          onMouseDown={(e) => e.preventDefault()}
        >
          {showPasswd ? <Icon>visibility_off</Icon> : <Icon>visibility</Icon>}
        </IconButton>
      ) : null;
    iae =
      iae || endAdornment ? (
        <InputAdornment position="end">
          {endAdornment}
          {iae}
        </InputAdornment>
      ) : null;

    let chipList;
    if (chips && !useOptions) {
      chipList = value.map(
        (option, index, arr) => (
          <MyChip
            key={`${this.key}-${option}-${index}`}
            dragZone={dragZone}
            dragValue={{
              value: option,
              dropped: option,
              index,
              items: arr,
              component: dragComponent,
            }}
            dragTest={
              ({ dragZone, props, isDragging, dragHandle, dragValue }) => true
              //                console.log(`'${dragZone}'`, props, isDragging, dragHandle, dragValue)
            }
            onDoubleClick={(e) =>
              console.log("chipDoubleClick", option) ||
              this.setState({ inputValue: option })
            }
            onDelete={(e) =>
              this.doChange(
                value.slice(0, index).concat(value.slice(index + 1))
              )
            }
            onChange={(e) => this.doChange(e.target.value)}
            clickable={clickable}
            index={index}
            label={option}
            size="small"
          />
        ),
        this
      );
    }

    //    chipList && console.log(listStyle);
    const ias = startAdornment ? (
      <InputAdornment position="start">{startAdornment}</InputAdornment>
    ) : (
      chipList && (
        <div position="start" style={listStyle}>
          {chipList}
        </div>
      )
    );
    const iField = useOptions ? (
      <>
        {ias ? ias : null}
        <Autocomplete
          id={this.key}
          value={value}
          disabled={disabled}
          //          inputValue={inputValue}
          label={label}
          size={size}
          fullWidth={fullWidth}
          options={options}
          freeSolo={freeSolo}
          disableClearable={disableClearable || !multiple}
          multiple={multiple}
          noOptionsText={noOptionsText}
          getOptionLabel={(o) => {
            if (getOptionLabel) return getOptionLabel(o, options);
            //            console.log(`getOptionLabel '${o}'`, options);
            if (typeof o === "object" && o.label !== undefined) return o.label;
            for (const opt of options)
              if (typeof opt === "string" && o == opt) return o;
              else if (opt.value == o) return opt.label;
            console.log(`getOptionLabel '${o}'`, options);
            if (!o && options.length) {
              const fo = options[0];
              return typeof fo === "string" ? fo : fo.label;
            }
            return "..unknown";
          }}
          getOptionSelected={(o, t) => {
            if (getOptionSelected) return getOptionSelected(o, t, options);
            //            console.log("getOptionSelected", o, t, options);
            return typeof o === "string" ? o === t : o.value === t;
          }}
          onChange={(e, v, reason) => {
            //            console.log("acomplete onchANGE", id, e, e.target.value, v, reason);
            this.doChange(v, e, reason);
            //            onChange && onChange(e, v, reason);
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              if (!chips) return undefined;
              const tp = getTagProps({ index });
              tp.key = option + "-" + tp.key;
              return <Chip label={option} size={"small"} {...tp} />;
            })
          }
          renderInput={
            renderInput ||
            ((params) => {
              //                            console.log("renderInput",id, params);
              this.onChangeFun =
                params.inputProps && params.inputProps.onChange
                  ? (v) => params.inputProps.onChange({ target: { value: v } })
                  : () => null;

              return (
                <TextField
                  {...Iob.mergeProps(params, {
                    style: {
                      fontSize: 14,
                      ...(fullWidth ? {} : { width, minWidth }),
                    },
                  })}
                  //                value={inputValue}
                  label={label}
                  fullWidth={fullWidth}
                  onChange={(e) =>
                    //                    console.log("onChange TextField", e) ||
                    this.setState({ inputValue: e.target.value })
                  }
                  onKeyUp={(e) =>
                    e.key == "Escape" ? this.setState({ inputValue: "" }) : null
                  }
                  //                    fullWidth={fullWidth}
                  error={nerror}
                  {...params.inputProps}
                  //                    {...}
                />
              );
            })
          }
          {...more}
          //          onChange={(e, v) => this.doChange(v)}
        />
        {endAdornment ? endAdornment : null}
      </>
    ) : (
      <Input
        value={multiple ? inputValue : value}
        type={showPasswd ? "text" : this.type}
        disabled={disabled}
        id={this.key}
        label={label}
        startAdornment={!useOptions && ias}
        endAdornment={iae}
        onKeyUp={(e) => {
          if (multiple)
            switch (e.key) {
              case "Escape":
                this.setState({ inputValue: "" });
                break;
              case "Enter":
                if (inputValue !== "") {
                  this.doChange(value.concat(e.target.value));
                  this.setState({ inputValue: "" });
                }
                break;
              case "Backspace":
                /*                 console.log(
                  `'${inputValue}'`,
                  this.avoidDelete,
                  value,
                  value.slice(0, value.length - 1)
                );
 */
                if (inputValue == "" && value.length && !this.avoidDelete)
                  this.doChange(value.slice(0, value.length - 1));
                this.avoidDelete = false;
                break;
              default:
              //                console.log(e.key);
            }
        }}
        error={error}
        onChange={(e) => {
          const en = e.nativeEvent;
          const value = e.target.value;
          this.avoidDelete =
            en.inputType === "deleteContentBackward" && value === "";
          this.onChangeInputValue(value);
        }}
        {...more}
        inputProps={Iob.mergeProps(inputProps, {
          style: { alignSelf: "flex-end" },
        })}
      />
    );

    //    if (chips) console.log(this.key, value, inputValue);
    const autocomp =
      chips && !useOptions
        ? //        <div style={{ display: "flex", flexFlow: "row wrap", width: "20vw" }}>
          //          {chipList}
          //          {chips ? <InputLabel htmlFor={this.key}>{label}</InputLabel> : null}
          //          {iField}

          iField
        : //        </div>
          iField;

    return (
      <FormControl
        ref={this.myInput}
        {...{ required, size, margin, disabled, fullWidth }}
        hiddenLabel={!label}
        error={nerror}
        style={{ marginTop: "4px" }}
      >
        {!useOptions && label ? (
          <InputLabel htmlFor={this.key}>{label}</InputLabel>
        ) : null}
        {iField}
        {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
      </FormControl>
    );
  }
}

function IButton(props) {
  const {
    tooltip,
    size,
    icon,
    onClick,
    src,
    disabled,
    ...passThroughProps
  } = props;
  function handleClick(e) {
    if (src) window.open(src, "_blank");
    if (onClick) onClick(e);
  }
  const nstyle =
    onClick || src ? { style: { cursor: "pointer" } } : { style: {} };
  if (disabled) nstyle.style.color = "grey";

  if (size) passThroughProps.fontSize = size;
  const sw = (
    <Icon
      {...Iob.mergeProps(passThroughProps, nstyle)}
      onClick={(e) => handleClick(e)}
    >
      {icon}
    </Icon>
  );
  return (disabled && sw) || AddTooltip(tooltip, sw);
}

class UButton extends React.Component {
  constructor(props) {
    super(props);
    const {
      keyId,
      tooltip = "",
      disabled = false,
      narrow,
      icon,
      isOver = false,
      dropLabel = t("drop {0} here", label),
      dropStyle = { color: "black" },
      startIcon,
      endIcon,
      label,
      size = "medium",
      ...passThroughProps
    } = props;
    const state = {
      label,
      size,
      disabled,
      isOver,
      dropLabel,
      dropStyle,
      "aria-label": label ? label : "",
      ...passThroughProps,
    };

    const iFontSize = size == "small" || size == "large" ? size : "default";
    if (startIcon)
      state.startIcon =
        typeof startIcon === "string" ? (
          <Icon fontSize={iFontSize}>{startIcon}</Icon>
        ) : (
          startIcon
        );
    else if (icon)
      state.startIcon =
        typeof icon === "string" ? (
          <Icon fontSize={iFontSize}>{icon}</Icon>
        ) : (
          icon
        );
    else if (endIcon)
      state.endIcon =
        typeof endIcon === "string" ? (
          <Icon fontSize={iFontSize}>{endIcon}</Icon>
        ) : (
          endIcon
        );

    this.state = state;
  }

  loadTextFromFile(files) {
    this.setState({ isOver: false });
    if (!files.length) return;
    const file = files[0];
    //    console.log("onDrop Files:", files, file);
    const reader = new FileReader();
    reader.onload = (e) => {
      let r = e.target.result;
      const receivedFile = this.props.receivedFile;
      receivedFile && receivedFile(r, file.path);
    };
    reader.readAsText(file);
  }

  render() {
    const {
      disabled,
      narrow,
      icon,
      receivedFile,
      isOver,
      dropLabel,
      dropStyle,
      startIcon,
      endIcon,
      label,
      size,
      ...passThroughProps
    } = this.state;
    const { keyId, tooltip } = this.props;
    const sw = (
      <MakeDroppable
        dropZone={NativeTypes.FILE}
        dropOptions={{}}
        dropKey={keyId}
        isOverProps={{}}
        dropMonitor={(e) => {
          if (isOver !== e.dropZone) {
            //            console.log("monitor", keyId, e);
            this.setState({ isOver: e.dropZone });
          }
        }}
        /*       canDropHere={(...e) => {
        console.log("canDropHere", e);
        return true;
      }}
    */
        dropAction={(e) => this.loadTextFromFile(e.files)}
      >
        <Button
          {...passThroughProps}
          startIcon={startIcon}
          endIcon={endIcon}
          style={isOver ? dropStyle : null}
        >
          {!narrow || isOver ? (isOver ? dropLabel : label) : null}
        </Button>
      </MakeDroppable>
    );
    return (disabled && sw) || AddTooltip(tooltip, sw);
  }
}

function RButton(props) {
  const { checked, onChange, iconOn, iconOff, ...rest } = props;
  const [isChecked, setChecked] = useState(!!checked);
  return (
    <TButton
      icon={
        isChecked
          ? iconOn || "radio_button_checked"
          : iconOff || "radio_button_unchecked"
      }
      onClick={(e) => {
        onChange && onChange(!isChecked);
        setChecked(!isChecked);
      }}
      {...rest}
    />
  );
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
  //  if (addProps) console.log(label, addProps, nprops);
  const iFontSize =
    nprops.size == "small" || nprops.size == "large" ? nprops.size : "default";
  if (startIcon)
    nprops.startIcon =
      typeof startIcon === "string" ? (
        <Icon fontSize={iFontSize}>{startIcon}</Icon>
      ) : (
        startIcon
      );
  else if (icon && label && !narrow)
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
  let sw = (
    <Button {...nprops}>
      {!narrow && label ? (
        label
      ) : icon ? (
        <Icon fontSize={iFontSize}>{icon}</Icon>
      ) : null}
    </Button>
  );
  //  if (addProps) sw = <span {...addProps}>{sw}</span>
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

function AddTooltip2({ tooltip, children, ...props }) {
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
  }

  componentDidMount() {
    this.divRef.current.innerHTML = this.props.html || "";
  }

  render() {
    const { html, component = "span", children, ...rest } = this.props;
    const TagName = component;
    return (
      <TagName ref={this.divRef} {...rest}>
        {children}
      </TagName>
    );
  }
}

class IDialog extends React.Component {
  constructor(props) {
    super(props);
    const {
      type = "default",
      options = {},
      children,
      justUpdate,
      ...rprops
    } = props;
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

  shouldComponentUpdate(nextProps, nextState) {
    let { children, ...tprops } = this.props;
    let nprops = { ...nextProps };
    delete nprops["children"];
    //    if (this.state.type=="activeOk") console.log(tprops,nprops, this.state, nextState);
    if (
      JSON.stringify(tprops) == JSON.stringify(nprops) &&
      JSON.stringify(this.state) == JSON.stringify(nextState)
    ) {
      return false;
    } else {
      return true;
    }
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
      title = t("please select"),
      text,
      html,
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
    const handle = id + "-title";
    //    console.log(type, open, show, options);
    function DragPaper(props) {
      return (
        <Draggable
          handle={"#" + handle}
          cancel={'[class*="MuiDialogContent-root"]'}
        >
          <Paper {...props} />
        </Draggable>
      );
    }
    return (
      <Dialog
        open={open}
        {...rprops}
        onClose={(...e) => this.handleClose(false, e)}
        onEscapeKeyDown={(...e) => this.handleClose(false, e)}
        onExit={(...e) => this.callback && this.callback(this.how)}
        PaperComponent={DragPaper}
        PaperProps={paperProps}
        aria-labelledby={handle}
      >
        {title && <DialogTitle id={handle}>{title}</DialogTitle>}
        <DialogContent>
          {text ||
            (html && (
              <DialogContentText>
                {text}
                {html ? <HtmlComponent html={html}></HtmlComponent> : null}
              </DialogContentText>
            ))}
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
  MyChip,
  IDialog,
  UButton,
  TButton,
  IButton,
  AddTooltip,
  AddTooltip2,
  RButton,
  useSingleAndDoubleClick,
  ScrollTop,
  MakeDroppable,
  MakeDraggable,
  HtmlComponent,
  AutocompleteSelect,
  styles,
};

export default styles;
