import React from "react";
//import { withStyles, makeStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
import { AddTooltip, AddIcon, IButton } from "./UiComponents";
import { Iob, connect } from "./Iob";
import {
  Typography,
  Checkbox,
  FormControlLabel,
  Input,
  Select,
  MenuItem,
  InputAdornment,
} from "@material-ui/core";
//import { config } from "chai";
//import { isNotEmittedStatement } from "typescript";

class EditState extends React.PureComponent {
  constructor(props) {
    super(props);
    const items = props.item || [];
    this.classes = props.classes;
    //    const store = Iob.getStore;
    const { name, adapterStates, adapterObjects, adapterInstance } = props;
    const id = name.startsWith(".") ? adapterInstance + name : name;
    const istate = adapterStates[id];
    const object = adapterObjects[id] && adapterObjects[id].common;
    this.state = {
      item: items,
      istate,
      name,
      id,
      object,
      iKey: props.iKey,
      value: istate && istate.val,
    };
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }

  static getDerivedStateFromProps(props, state) {
    let newState = null;
    const { name, adapterStates, adapterObjects, adapterInstance } = props;
    const id = name.startsWith(".") ? adapterInstance + name : name;
    const istate = adapterStates[id];
    const object = adapterObjects[id] && adapterObjects[id].common;
    //    console.log("derivedState:", state.opvalue, props.value, state.value);
    if (
      state.id != id ||
      name !== state.name ||
      istate !== state.istate ||
      object !== state.object
    ) {
      //      console.log("Prop value changed!", state.opvalue, props.value, state.value);
      newState = { istate, object, id, name };
    }
    return newState;
  }

  onChangeValue(val, e) {
    //    console.log("SetState", this.name, "to", val);
    Iob.setStateValue(this.state.name, { val, ack: false });
  }
/*
  shouldComponentUpdate(nextProps, nextState) {
    //    console.log('Greeting - shouldComponentUpdate lifecycle');
    //    const store = Iob.getStore;
    const { adapterStates, adapterObjects, adapterInstance } = this.props;
    const name = this.props.name.startsWith(".")
      ? adapterInstance + this.props.name
      : this.props.name;
    const istate = adapterStates[name];
    const object = adapterObjects[name] && adapterObjects[name].common;
    if (
      JSON.stringify(istate) != JSON.stringify(this.state.istate) ||
      JSON.stringify(object) != JSON.stringify(this.state.object) ||
      (istate && istate.val != this.state.value) ||
      this.state.value != this.state.ovalue
    ) {
      Object.assign(nextState, { istate, object, ovalue: this.state.value });
      //      console.log(nextState, this.props);
      return true;
    }
    return false;
  }
*/
  render() {
    const { item, istate, object, iKey, value, id } = this.state;
    const { role, type, write, unit, states } = object || {};
    const { val, ack, ts, q, from } = istate || {};
    const sw = istate ? istate.val.toString() : "";
    const usw = Iob.nbsp(sw + (unit ? " " + unit : ""));
    const {
      tooltip,
      label,
      labelPlacement,
      prependIcon,
      style = {},
      disabled,
      size = "medium",
      key = iKey,
      variant = "body2",
      color = "primary",
      ...nprops
    } = item;
    const rest = { ...nprops, size, key, variant };
    function typogaphy(text) {
      return (
        <Typography color={color} {...rest}>
          {Iob.nbsp(` ${text} `)}
        </Typography>
      );
    }
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
    let sr = typogaphy(usw);
    switch (type) {
      case "boolean":
        sr =
          role == "button" ? (
            <IButton color={color} icon="touch_app" onClick={(e) => this.onChangeValue(true, e)} />
          ) : (
            <Checkbox
              {...rest}
              checked={!!val}
              disabled={!write}
              onChange={(e) => this.onChangeValue(!val, e)}
              color={color}
            />
          );
        break;
      case "string":
      case "number":
        //        if (write) {
        if (states) {
          const nst = states.split(";").map((i) => {
            const o = i.split(":").map((j) => j.trim());
            if (o.length == 1) o[1] = o[0];
            if (type === "number") o[0] = Number(o[0]);
            return o;
          });
          const nsl = nst.find((i) => i[0] == val);
          const l = nsl && nsl.length ? `${nsl[1]} (${val})` : val;
          //          console.log(nst, nsl, l);
          if (write) {
            sr = (
              <Select value={val} onChange={(e) => this.onChangeValue(e.target.value, e)}>
                {nst.map((i, index) => (
                  <MenuItem key={index} value={i[0]}>
                    {i[1]}
                  </MenuItem>
                ))}
              </Select>
            );
          } else sr = typogaphy(l);
        } else if (write)
          sr = (
            <Input
              value={value}
              onChange={(e) => this.setState({ value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key == "Escape") {
                  this.setState({ value: val });
                } else if (e.key == "Enter") {
                  this.onChangeValue(type === "number" ? Number(value) : value, e);
                }
              }}
              endAdornment={
                value != val ? (
                  <InputAdornment position="end">
                    {unit}
                    <IButton
                      icon="done"
                      onClick={(e) =>
                        this.onChangeValue(type === "number" ? Number(value) : value, e)
                      }
                    />
                  </InputAdornment>
                ) : (
                  unit
                )
              }
              {...rest}
            />
          );
        //            }
        break;
      default:
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
    return AddTooltip(tooltip, AddIcon(prependIcon, sl));
  }
}

export default connect((state) => {
  const { adapterStatus, adapterStates, adapterObjects, adapterInstance } = state;
  return { adapterStatus, adapterStates, adapterObjects, adapterInstance };
})(EditState);
