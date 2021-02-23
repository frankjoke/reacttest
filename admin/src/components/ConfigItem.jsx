import React, { useRef } from "react";
//import { withStyles, makeStyles } from "@material-ui/core/styles";
//import I18n from "@iobroker/adapter-react/i18n";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
import { Iob, t, isPartOf, connect, makeFunction } from "./Iob";

import {
  InputField,
  InputChips,
  AddIcon,
  AddTooltip,
  IButton,
  TButton,
  HtmlComponent,
  MakeDroppable,
  MakeDraggable,
  useSingleAndDoubleClick,
  MyChip,
  UButton,
} from "./UiComponents";
import ConfigTable from "./ConfigTable";
import ConfigLog from "./ConfigLog";
import StateBrowser from "./StateBrowser";
import ObjectBrowser from "./ObjectBrowser";
import ConfigList from "./ConfigList";
import EditState from "./EditState";
//import InputChips from "./InputChips";
import {
  Typography,
  Checkbox,
  FormControl,
  InputLabel,
  InputBase,
  FormControlLabel,
  FormHelperText,
  Switch,
  TextField,
  TextareaAutosize,
  InputAdornment,
} from "@material-ui/core";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";
//import { config } from "chai";
//import { createSolutionBuilderWithWatch, isNoSubstitutionTemplateLiteral } from "typescript";
//import { restore } from "sinon";
//import { SIGTSTP } from "constants";
import { useDrag, useDrop } from "react-dnd";
import { createStubInstance } from "sinon";

class ConfigItem extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    this.events = {};
    this.errorString="";
    this.state = this.createState(props);
    this.onChangeFun = () => null;
    //    this.renderItem(this.state.item);
  }

  get error() {
    return this.errorString !== "";
  }
  check() {
    return true;
  }

  change(value) {
    this.checkRules(value);
    return value;
  }

  subscribeEvent(type = "stateChange", cb = (e) => true) {
    if (!this.events[type]) this.events[type] = [];
    const list = this.events[type];
    if (list.indexOf(cb) == -1) {
      list.push(cb);
      Iob.addEventListener(type, cb);
    }
  }

  componentWillUnmount() {
    for (const [type, funlist] of Object.entries(this.events))
      for (const fun of funlist) Iob.removeEventListener(type, fun);
  }
  createState(props) {
    const {
      field,
      rules,
      ieval,
      iselect,
      isOverProps,
      convertOld,
      changeItems,
      onStateChange,
      onObjectChange,
      ...citems
    } = props.item;
    let { canDropHere, dropAction, dropZone, ...items } = citems;
    const { dragZone, onClick, onChange } = items;
    const that = this;
    if (dropZone && !Array.isArray(dropZone)) dropZone = [dropZone];
    if (changeItems) {
      const commands = Array.isArray(changeItems) ? changeItems : [changeItems];
      for (const cmd of commands) {
        const fun = typeof cmd === "string" ? makeFunction(cmd, this, "$", "items", "Iob") : cmd;
        let res = undefined;
        try {
          res = fun(props.value, items, Iob);
        } catch (e) {
          Iob.logSnackbar("error;changeItems error {0}", e);
        }
      }
    }

    function prepareOnChange(item, event, that) {
      if (!item) return;
      const commands = Array.isArray(item) ? item : [item];
      for (const cmd of commands) {
        let fun;
        if (typeof cmd === "string") fun = makeFunction(cmd, that, "e", "Iob");
        else if (typeof cmd === "function") fun = cmd;
        if (!fun) {
          Iob.logSnackbar("warning;on{0} is not a string nor a function '{1}'", event, cmd);
          continue;
        }
        const sfun = (ev) => {
          let res = undefined;
          try {
            res = fun(ev, Iob);
          } catch (e) {
            Iob.logSnackbar("error;on{0} error {1}", event, e);
          }
          return res;
        };
        that.subscribeEvent(event, sfun);
        //          console.log("subscribeStateCHange", this.getKey(), cmd);
      }
    }

    function convertFun(item, name, that, dres) {
      let fun;
      if (typeof item === "string") fun = makeFunction(cmd, that, "e", "that", "Iob");
      else if (typeof item === "function") fun = item;
      if (!fun) {
        Iob.logSnackbar("warning;{0} is not a string nor a function '{1}'", name, item);
        return () => dres;
      }
      return (ev) => {
        let res = dres;
        try {
          res = fun(ev, that, Iob);
        } catch (e) {
          Iob.logSnackbar("error;{0} error {1}", name, e);
        }
        return res;
      };
    }

    prepareOnChange(onStateChange, "stateChange", this);
    prepareOnChange(onObjectChange, "objectChange", this);

    if (canDropHere) canDropHere = convertFun(canDropHere, "canDropHere", this, true);
    if (dropAction) dropAction = convertFun(dropAction, "dropAction", this, true);

    function makeSel(sel, char) {
      const def = { value: "", label: "" };

      return sel.split(char).map((i) => {
        const sp = i.split("=").map((i) => i.trim());
        if (sp.length == 2) return { value: sp[0], label: t(sp[1]) };
        else if (sp.length == 1) return { value: sp[0], label: sp[0] };
        else return def;
      });
    }

    const state = { value: props.value };
    if (onClick) {
      let fun;
      if (typeof onClick === "string") {
        try {
          fun = makeFunction(onClick, this, "event", "value", "Iob");
        } catch (e) {
          Iob.logSnackbar(
            "error;onClick create function error {0} in function generated from: {1}",
            e.toString(),
            onClick
          );
        }
      } else if (typeof onClick === "function") fun = onClick;
      else Iob.logSnackbar("error;onClick invalid function type: {0}", onClick);
      if (fun) {
        items.onClick = ((event, value) => {
          try {
            fun(event, value, Iob);
          } catch (e) {
            //            console.log(`onClick error ${e} in function generatied from: '${onClick}'`);
            Iob.logSnackbar(
              "error;onClick error {0} in function generated from: {1}",
              e.toString(),
              onClick
            );
          }
        }).bind(this);
      }
    }

    if (convertOld) {
//      console.log("convertOld:",convertOld)
      const fun =
        typeof convertOld !== "function"
          ? makeFunction(convertOld, that, "$", "props", "Iob")
          : convertOld;
      let res = undefined;
      try {
//          fun.apply(that,that.atate.value, that.props, Iob);
        res = fun(state.value, props, Iob, that);
      } catch (e) {
        Iob.logSnackbar("error;convertOld error {0}", e.toString());
      }
      if (res !== null && res !== undefined && res !== state.value) {
        state.value = res;
        //        console.log("convertOld:", this.props.attr, props.value, res);
        if (props.field !== "$undefined") this.props.onUpdateValue(this.props.attr, res);
      }
      //          Iob.setStore.updateInativeValue({ attr: this.props.attr, value:res });
    }

    let sel = iselect;
    if (sel && !Array.isArray(sel)) {
      //      console.log("select=", sel, this.props.settings.props.ipAddresses);
      if (typeof sel === "string") {
        if (sel.startsWith("|")) sel = makeSel(sel.slice(1), "|");
        else if (sel.startsWith("{")) {
          let fun = undefined,
            rsel = null;
          try {
            fun = makeFunction(sel, this, "$", "props", "Iob");
            rsel = fun(state.value, this.props, Iob);
            //            console.log("select executed get function:", sel, rsel);
            if (Array.isArray(rsel)) sel = rsel;
          } catch (e) {
            console.log("got select function error:", e);
          }
        } else sel = makeSel(sel, ";");
        state.iselect = sel;
      } else if (typeof sel === "function") {
        state.iselect = sel.bind(this)(state.value, this.props, Iob);
      }
    } else if (Array.isArray(sel)) state.iselect = sel;
    else if (sel) state.iselect = [sel];

    if (ieval) {
      state.ieval = (Array.isArray(ieval) ? ieval : [ieval]).map((ei) =>
        ei && typeof ei === "string" ? makeFunction(ei, this, "$", "items", "Iob") : ei
      );
    }

    if (rules) {
      const values = (Array.isArray(rules) && rules) || (rules && [rules]) || null;
      if (values)
        state.rules = values.map((i) =>
          typeof i === "function" ? i.bind(that) : makeFunction(i, that, "$", "t")
        );
    }

    //    console.log(this.getKey(), Iob.type(this.props.value));
    //    this.opvalue = props.native;
    return {
      item: { ...items },
      field,
      itype: items.itype.trim(),
      dropZone,
      dragZone,
      dropAction,
      canDropHere,
      isOverProps,
      ...state,
    };
  }

  static getDerivedStateFromProps(props, state) {
    let newState = null;
    //    console.log("derivedState:", state.opvalue, props.value, state.value);
    if (props.value != state.opvalue) {
      //      console.log("Prop value changed!", state.opvalue, props.value, state.value);
      newState = { value: props.value, opvalue: props.value };
    }
    return newState;
  }

  setErr(err) {
    const errorString = this.errorString;
    const iserr = err !== true && err !== "";
    const errstr = iserr ? err : "";
    //    this.setState({errorString: this.errorString});
    if (errorString !== errstr) {
//      console.log(this, errstr, iserr, errorString);
      this.errorString = errstr;
      //      this.setState({ errorString: errstr, error:iserr });
      setTimeout(this.forceUpdate.bind(this), 10);
    }
    return errstr;
  }

  getKey(index) {
    return this.props.index + (index !== undefined ? `/${index}` : "");
  }

  testRules(value) {
    const rules = this.state.rules;
    let check = true;
    if (!rules) return true;
    try {
      for (const rule of rules) {
        check = rule(value, t, this, Iob);
        if (check !== true) break;
      }
    } catch (e) {
      console.log("error in check rules:", e);
      return e.toString();
    }
    return check;
  }

  checkRules(value) {
    const { rules } = this.state;
    const check = this.testRules(value);
//    if (this.errorString) console.log("checkRules", value, check, this.error, this.errorString);
    this.setErr(check);
    return check;
  }

  uniqueTableRule(val) {
    const table = this.props.table;
    const field = this.props.field;
    if (!table) return true;
    const v = ("" + val).trim();
    const found = table.filter((i) => ("" + i[field]).trim() == v);
    return found.length <= 1 || this.t("This item can only be once per table in this field!");
  }

  doChangeValue(value, e) {
    if (this.check(value)) value = this.change(value);
    //    console.log(value, this.props.attr, `'${this.errorString}'`);
    this.setState({ value });
    //    debugger;
    if (typeof this.state.item.onClick === "function") this.state.item.onClick(e, value, Iob);
    if (this.props.field !== "$undefined" && this.props.onUpdateValue)
      this.props.onUpdateValue(this.props.attr, value);
  }

  $text(item) {
    let { label, text, html, ...items } = item;
    const { value } = this.state;
    if (Array.isArray(text)) text = text.join("");
    if (Array.isArray(html)) html = html.join("<br>");
    if (!text && !html && !label && value !== undefined && value !== null) text = value.toString();
    let res = [];
    if (label)
      res.push(
        <Typography key={this.getKey("l")} {...items} variant={items.lvariant || "subtitle1"}>
          {label}
        </Typography>
      );
    if (text)
      res.push(
        <Typography key={this.getKey("t")} {...items}>
          {text}
        </Typography>
      );
    if (html) res.push(<HtmlComponent key={this.getKey("h")} {...items} html={html} />);
    return res;
  }

  $html(item) {
    let { label, text, ...items } = item;
    const { value } = this.state;
    //    console.log("html:", split);
    if (Array.isArray(text)) text = text.join("");
    if (!text && !label && value !== undefined && value !== null) text = value.toString();
    const res = [];
    if (label)
      res.push(
        <Typography key={this.getKey("l")} {...items} variant={items.lvariant || "subtitle1"}>
          {label}
          <br />
        </Typography>
      );
    if (text) res.push(<HtmlComponent key={this.getKey("t")} {...items} html={text} />);
    return res;
  }

  $textarea(item) {
    const {
      prependIcon,
      label,
      rowsMax = 10,
      rowsMin = 2,
      hint,
      width,
      defaultValue,
      ...rest
    } = item;
    const { value, errorString } = this.state;
    const key = this.getKey();
    const sw = (
      <FormControl required error={!!this.errorString} /* className={classes.formControl} */>
        {label && (
          <InputLabel shrink required={required} htmlFor={key}>
            {label}
          </InputLabel>
        )}
        <TextareaAutosize
          id={key}
          rowsMax={rowsMax}
          rowsMin={rowsMin}
          width="100%"
          value={typeof value === "string" ? value : (value && value.toString()) || ""}
          onChange={(e) => this.doChangeValue(e.target.value, e)}
          {...rest}
        />
        {hint || this.errorString ? <FormHelperText>{this.errorString || hint}</FormHelperText> : null}
      </FormControl>
    );
    return AddIcon(prependIcon, sw);
  }

  $switch(item) {
    this.change = (value) => !this.state.value;
    const {
      tooltip,
      label,
      labelPlacement,
      prependIcon,
      size = "medium",
      color = "primary",
      ...items
    } = item;
    const key = this.getKey();
    const sw = (
      <FormControlLabel
        control={
          <Switch
            key={key}
            size={size}
            color={color}
            {...items}
            checked={!!this.state.value}
            onChange={(e) => this.doChangeValue(!this.state.value, e)}
          />
        }
        label={label}
        labelPlacement={labelPlacement || "end"}
      />
    );
    return AddTooltip(tooltip, AddIcon(prependIcon, sw));
  }

  $checkbox(item) {
    this.change = (value) => !this.state.value;
    const {
      tooltip,
      label,
      labelPlacement,
      prependIcon,
      size = "medium",
      color = "primary",
      ...items
    } = item;
    const key = this.getKey();
    //    console.log("Color:", color);
    const sw = (
      <FormControlLabel
        control={
          <Checkbox
            key={key}
            size={size}
            color={color}
            {...items}
            checked={!!this.state.value}
            onChange={(e) => this.doChangeValue(!this.state.value)}
          />
        }
        label={label}
        labelPlacement={labelPlacement || "end"}
        color={color}
      />
    );
    return AddTooltip(tooltip, AddIcon(prependIcon, sw));
  }

  $select(item) {
    const {
      label,
      prependIcon,
      required,
      hint,
      defaultValue,
      tooltip,
      disabled,
      margin = "none",
      fullWidth = true,
      size = "medium",
      color = "primary",
      ...items
    } = item;
    const key = this.getKey();
    const { iselect = [{ value: "", label: "...loading" }] } = this.state;
    const oselect = {};
    iselect.map((i) => (oselect[i.value] = i.label));
    const value = this.state.value || "";
    const helper = this.error ? this.errorString : hint ? hint : "";
    //    console.log("select:", `'${value}'`, key, iselect, items);
/*     const sw = (
      <FormControl
        {...{ required, size, margin, disabled, fullWidth }}
        hiddenLabel={true}
        error={this.error}
      >
        <Autocomplete
          value={value}
          options={iselect}
          id={key}
          key={key}
          size={size}
          color={color}
          disabled={disabled}
          disableClearable
          getOptionSelected={(o, v) => o.value == v}
          onChange={(e, v) => this.doChangeValue(v.value, e)}
          getOptionLabel={(option) =>
            typeof option === "object" ? option.label : oselect[option] || ""
          }
          renderInput={(params) => <TextField {...params} label={label} size="small" />}
        ></Autocomplete>
        {helper ? <FormHelperText>{helper}</FormHelperText> : null}
      </FormControl>
    );
 */
    const sw = (
      <InputField
        {...{ required, size, margin, disabled, fullWidth }}
        error={this.error}
        label={label}
        errorString={this.errorString}
        helper={hint}
          value={value}
          options={iselect}
          id={key}
          key={key}
          size={size}
          color={color}
          disabled={disabled}
          disableClearable
//          getOptionSelected={(o, v) => o.value == v}
          onChange={(e, v) => /* console.log(`switch change`,e,v) || */ this.doChangeValue(e.target.value.value)}
          getOptionLabel={(option) =>
            typeof option === "object" ? option.label : oselect[option] || ""
          }
//          renderInput={(params) => <TextField {...params} label={label} size="small" />}
          />
    );
    return AddIcon(prependIcon, AddTooltip(tooltip, sw));
  }
  $chips(item) {
    let {
      prependIcon,
      hint,
      label,
      size = "medium",
      color = "primary",
      placeholder = "",
      canRearrange,
      required,
      freeSolo,
      clickable,
      disabled,
      fullWidth = true,
      margin = "none",
      ...items
    } = item;
    const key = this.getKey();
    let { value, iselect = [], dragZone, dropZone, itype, field } = this.state;
    if (!Array.isArray(value)) {
      if (typeof value === "string") {
        value = Iob.stringToArrayComma(value);
      } else value = [];
    }

    if (value.length) placeholder = "";
    //    const helperText = errorString ? errorString : hint;
    //    console.log(itype, field, dragZone, dropZone, value, iselect);
    let sw = (
      <InputField
        {...{ required, size, margin, disabled, hint, fullWidth, label, disabled }}
        //      hiddenLabel={!label}
        errorString={this.errorString}
        options={iselect}
        dragZone={dragZone}
        error={this.error}
        errorString={this.errorString}
        onChange={(e) => this.doChangeValue(e.target.value)}
        id={key}
        type="chips"
        value={value}
        canRearrange={true}
        {...items}
      />
    );
    return AddIcon(
      prependIcon,
      sw
    );
  }

  $table(item) {
    const { value, settings, attr, onUpdateValue } = this.props;
    return (
      <ConfigTable
        index={this.getKey()}
        item={item}
        inative={value}
        settings={settings}
        attr={attr}
        rows={value}
        onUpdateValue={onUpdateValue}
        columns={item.items}
        {...item}
      />
    );
  }

  $object(item) {
    const { value, settings, attr, onUpdateValue } = this.props;
    return (
      <ConfigList
        index={this.getKey()}
        page={item}
        inative={value || {}}
        attr={attr}
        onUpdateValue={onUpdateValue}
        {...item}
      />
    );
  }

  $grid(item) {
    const { inative, settings, attr, onUpdateValue } = this.props;
    return (
      <ConfigList
        index={this.getKey()}
        page={item}
        inative={inative}
        attr={attr}
        onUpdateValue={onUpdateValue}
        {...item}
      />
    );
  }

  $icon(item) {
    //    this.change = (value) => !this.props.value;
    //    const { tooltip, label, ...rest } = item;
    const { size = "medium", color = "primary", key = this.getKey(), ...items } = item;
    return <IButton key={key} size={size} color={color} {...items} />;
  }

  $button(item) {
    //    this.change = (value) => !this.props.value;
    //    const { tooltip, label, ...rest } = item;
    const { size = "small", color = "primary", key = this.getKey(), ...items } = item;
    return <UButton key={key} keyId={key} size={size} color={color} {...items} />;
  }

  $password(item) {
    return this.$string(item, "password");
  }

  $string(item, type = "text") {
    const key = this.getKey();
    const { prependIcon, size = "medium", ...rest } = item;
    let { value } = this.state;
    //    console.log(key, value, errorString, error);
    if (value === null || value === undefined) value = "";
    const props = { value, type, size };
    return AddIcon(
      prependIcon,
      <InputField
        error={!!this.errorString}
        errorString={this.errorString}
        id={key}
        {...props}
        {...rest}
        onChange={(e) => this.doChangeValue(e.target.value, e)}
      />
    );
  }

  $log(item) {
    return <ConfigLog item={this.state.item} />;
  }

  $stateBrowser(item) {
    const { inative, settings, attr, onUpdateValue } = this.props;
    return (
      <StateBrowser
        item={this.state.item}
        index={this.getKey()}
        inative={inative}
        attr={attr}
        onUpdateValue={onUpdateValue}
      />
    );
  }

  $number(item) {
    //    console.log(item);
    let { min, max, fixed, zero, ...items } = item;
    min = typeof min === "number" ? min : Number.NEGATIVE_INFINITY;
    max = typeof max === "number" ? max : Number.POSITIVE_INFINITY;
    let value = this.state.value;
    this.check = (value) => {
      let val = fixed ? parseInt(value) : parseFloat(value);
      if (typeof value !== "number") {
        if (val === NaN && !value) val = 0;
      }
      // console.log("number", value, val, item);
      if (val === NaN || val.toString() != value)
        return this.setErr(t(fixed ? "Not an integer: {0}" : "Not a number: {0}", `'${value}'`));
      else if (!zero || val !== 0) {
        if (val < min) return this.setErr(t("value must not be smaller than {0}!", min));
        else if (val > max) return this.setErr(t("value must not be bigger than {0}!", max));
        else if (fixed && parseFloat(value) != val)
          return this.setErr(t("number need to be an integer!"));
      }
      return true;
    };
    this.change = (value) => (fixed ? parseInt(value) : parseFloat(value));
    this.setErr(this.check(value));
    return this.$string(items);
  }

  $state(item) {
    const { name, ...items } = item;
    return <EditState item={items} iKey={this.getKey()} name={name} />;
  }

  $objectBrowser(item) {
    const { ...items} = item;
//    console.log(items);
    return <ObjectBrowser 
      value={this.state.value}
      {...items}
    />
  }
  render() {
    //    if (!itemR) return itemR = this.state.item;
    //    console.log(this.props.index);
    const { ieval, itype, item, canDropHere, dropAction, dropZone, isOverProps } = this.state;
    const nitem = Object.assign({}, item);
    const { disabled } = nitem;
    if (typeof disabled === "function") nitem.disabled = disabled(this.props, Iob);
    else if (typeof disabled === "string")
      try {
        const fun = Iob.makeFunction(disabled, this, "props", "Iob");
        const res = fun(this.props, Iob);
        nitem.disabled = res;
      } catch (e) {
        Iob.logSnackbar("error; error in displayIf for {0}: {1}", key, e);
        nitem.disabled = !!disabled;
      }
    if (Array.isArray(ieval))
      for (const ei of ieval)
        try {
          ei(this.state.value, nitem, Iob);
        } catch (e) {
          Iob.logSnackbar("error;ieval error {0}", e);
          console.log("ieval error:", e);
        }

    let sw =
      isPartOf(
        itype,
        "$objectBrowser|$grid|$stateBrowser|$object|$state|$text|$html|$number|$string|$password|$switch|$button|$checkbox|$select|$chips|$table|$textarea|$icon|$log"
      ) && typeof this[itype] === "function" ? (
        this[itype](nitem)
      ) : (
        <span>{this.props.index + ":" + JSON.stringify(nitem, null, 2)}</span>
      );
    if (!dropZone) return sw;
    return (
      <MakeDroppable
        dropZone={dropZone}
        canDropHere={(e) => {
//          console.log("canDrop", dropZone, e);
          const test = canDropHere ? canDropHere(e, this, Iob) : this.testRules(e.value);
          //            console.log(dropZone, e.value, test);
          return test === true;
        }}
        dropAction={(e) => {
//          console.log("dropAction", dropZone, e);
          if (dropAction) return dropAction(e, this, Iob);
          const test = this.testRules(e.value);
          test === true
            ? this.doChangeValue(e.value, e)
            : Iob.logSnackbar("warning;dropped Value '{0}' invalid because of {1}", e.value, test);
        }}
        isOverProps={isOverProps}
      >
        {sw}
      </MakeDroppable>
    );
  }
}

export default ConfigItem;
