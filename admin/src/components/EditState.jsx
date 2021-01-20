import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
import { Iob, styles, t, splitProps, defaultProps, isPartOf, connect } from "./Iob";
import {
  Avatar,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Paper,
  Icon,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TablePagination,
  InputBase,
  Switch,
} from "@material-ui/core";
//import { config } from "chai";
//import { isNotEmittedStatement } from "typescript";

class EditState extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    const { items, split } = splitProps(props.item, "pageSize");
    const store = Iob.getStore;
    const { adapterStates, adapterObjects, adapterInstance } = store;
    this.name = props.name.startsWith(".") ? adapterInstance + props.name : props.name;
    const istate = adapterStates[this.name];
    const object = adapterObjects[this.name] && adapterObjects[this.name].common;
    this.state = defaultProps(split, { item: items, istate, object, fKey: props.fkey });
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }
/* 
  static getDerivedStateFromProps(props, state) {
    let newState = null;
    const store = Iob.getStore;
    const { adapterStates, adapterObjects, adapterInstance } = store;
    const name = props.name.startsWith(".") ? adapterInstance + props.name : props.name;
    const istate = adapterStates[name];
    const object = adapterObjects[name] && adapterObjects[name].common;
    //    console.log("derivedState:", state.opvalue, props.value, state.value);
    if (
      JSON.stringify(istate) != JSON.stringify(state.istate) ||
      JSON.stringify(object) != JSON.stringify(state.object)
    ) {
      //      console.log("Prop value changed!", state.opvalue, props.value, state.value);
      newState = { istate, object };
    }
    return newState;
  }

 */
  onChangeEvent(val) {
    console.log("SetState", this.name, "to", val);
    Iob.setStateValue(this.name, { val, ack: false });
  }

  shouldComponentUpdate(nextProps, nextState) {
    //    console.log('Greeting - shouldComponentUpdate lifecycle');
    const store = Iob.getStore;
    const { adapterStates, adapterObjects, adapterInstance } = store;
    const name = this.props.name.startsWith(".") ? adapterInstance + this.props.name : this.props.name;
    const istate = adapterStates[name];
    const object = adapterObjects[name] && adapterObjects[name].common;
    if (
      JSON.stringify(istate) != JSON.stringify(this.state.istate) ||
      JSON.stringify(object) != JSON.stringify(this.state.object)
    ) {
      Object.assign(nextState, { istate, object });
      return true;
    }
    return false;
  }

  render() {
    const { item, istate, object, fKey } = this.state;
    const { name, role, type, write, unit } = object || {};
    const { val, ack, ts, q, from } = istate || {};
    const sw = istate ? istate.val.toString() : "";
    const usw = sw + (unit ? " " + unit : "");
    const { tooltip, label, labelPlacement, prependIcon, style = {}, disabled, ...nprops } = item;
    const { color, ...rest } = defaultProps(nprops, {
      size: "medium",
      color: "primary",
      key: fKey,
      variant: "body2",
    });

    //    style.width = "100%";
    const title = `val=${val !== undefined && val.toString()}\nts=${Iob.timeStamp(
      ts
    )}\nack=${ack}, q=${q}\nfrom=${from}`;
    //    nprops.style = style;
    if (!tooltip) {
      rest.title = title;
    }
    //    console.log(this.props.adapterLog);
    //    console.log("chips:", sel, items);
//    console.log("EditState", this.name, this.state, istate, object);
    let sr = null;
    switch (type) {
      case "boolean":
        sr =
          role == "button" ? (
            <Iob.IButton icon="touch_app" onClick={(e) => this.onChangeEvent(true)} />
          ) : (
            <Checkbox
              {...rest}
              checked={!!val}
              onChange={(e) => this.onChangeEvent(!val)}
              color={color}
            />
          );
        break;
      default:
        sr = (
          <Typography color={color} {...rest}>
            &nbsp;{usw}&nbsp;
          </Typography>
        );
        break;
    }
    //    console.log("Color:", color);
    const sl = label ? (
      <FormControlLabel
        control={sr}
        label={label}
        labelPlacement={labelPlacement || "end"}
        color={color}
        title={rest.title}
      />
    ) : (
      sr
    );
    return Iob.AddTooltip(tooltip, Iob.AddIcon(prependIcon, sl));
  }
}

export default EditState;
