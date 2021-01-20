import React from "react";
//import { withStyles, makeStyles } from "@material-ui/core/styles";
//import I18n from "@iobroker/adapter-react/i18n";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
import { Iob, splitProps, defaultProps, t, isPartOf, connect, makeFunction } from "./Iob";
import InputChips from "./InputChips";
import ConfigTable from "./ConfigTable";
import ConfigLog from "./ConfigLog";
import EditState from "./EditState";
import {
  Typography,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  FormHelperText,
  Switch,
  TextField,
  TextareaAutosize,
} from "@material-ui/core";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";
//import { config } from "chai";
//import { createSolutionBuilderWithWatch, isNoSubstitutionTemplateLiteral } from "typescript";
//import { restore } from "sinon";
//import { SIGTSTP } from "constants";

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

class ConfigItem extends React.Component {
  constructor(props) {
    super(props);
    this.events = {};
    this.state = this.createState(props);
    this.error = false;
    this.errorString = "";
    //    this.renderItem(this.state.item);
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
      convertOld,
      changeItems,
      onStateChange,
      onObjectChange,
      ...items
    } = props.item;
    const { onClick, onChange } = items;
    const that = this;

    if (changeItems) {
      const commands = Array.isArray(changeItems) ? changeItems : [changeItems];
      for (const cmd of commands) {
        const fun = typeof cmd === "string" ? makeFunction(cmd, this, "$", "items", "Iob") : cmd;
        let res = undefined;
        try {
          res = fun(props.value, items, Iob);
        } catch (e) {
          Iob.logSnackbar("error;changeItems error %s", e);
        }
      }
    }

    if (onStateChange) {
      const commands = Array.isArray(onStateChange) ? onStateChange : [onStateChange];
      for (const cmd of commands) {
        if (typeof cmd === "string") {
          const fun = makeFunction(cmd, this, "e", "Iob");
          const sfun = (ev) => {
            let res = undefined;
            try {
              res = fun(ev, Iob);
            } catch (e) {
              Iob.logSnackbar("error;onStateChange error %s", e);
            }
            return res;
          };
          this.subscribeEvent("stateChange", sfun);
          //          console.log("subscribeStateCHange", this.getKey(), cmd);
        }
      }
    }

    if (onObjectChange) {
      const commands = Array.isArray(onStateChange) ? onStateChange : [onStateChange];
      for (const cmd of commands) {
        if (typeof cmd === "string") {
          const fun = makeFunction(cmd, this, "e", "Iob");
          const sfun = (ev) => {
            let res = undefined;
            try {
              res = fun(ev, Iob);
            } catch (e) {
              Iob.logSnackbar("error;onObjectChange error %s", e);
            }
            return res;
          };
          this.subscribeEvent("objectChange", sfun);
        }
      }
    }

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

    if (onClick && typeof onClick !== "function") {
      if (typeof onClick === "string") {
        const fun = makeFunction(onClick, this, "event", "props", "Iob");
        items.onClick = ((event) => {
          try {
            fun(event, this.props, Iob);
          } catch (e) {
            console.log(`onClick error ${e} in function generatied from: '${onClick}'`);
            Iob.logSnackbar("error;onClick error %s in function generated from: %s", e, onClick);
          }
        }).bind(this);
      }
    } //    const { items, split } = splitProps(pitems, "xs|xl|sm|md|lg"); //    if (!split.sm && cols) split.sm = cols; //    if (!split.sm) split.sm = 3;
    if (convertOld) {
      const fun =
        typeof convertOld !== "function"
          ? makeFunction(convertOld, this, "$", "props", "Iob")
          : convertOld;
      let res = undefined;
      try {
        res = fun(state.value, props, Iob);
      } catch (e) {
        Iob.logSnackbar("error;convertOld error %s", e);
      }
      if (res !== null && res !== undefined && res !== state.value) {
        state.value = res;
        //        console.log("convertOld:", this.props.attr, props.value, res);
        if (props.field !== "$undefined")
          Iob.setStore.updateInativeValue({ attr: this.props.attr, value: res });
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
      }
    } else if (sel) state.iselect = [sel];

    if (ieval) {
      state.ieval = (Array.isArray(ieval) ? ieval : [ieval]).map((ei) =>
        ei && typeof ei === "string" ? makeFunction(ei, this, "$", "items", "Iob") : ei
      );
    }

    if (rules) {
      //    if (state.ieval)
      //      state.ieval(state.item, props.inative);
      const values = (Array.isArray(rules) && rules) || (rules && [rules]) || null;
      if (values) state.rules = values.map((i) => makeFunction(i, that, "$", "t"));
    }

    //    console.log(this.getKey(), Iob.type(this.props.value));
    //    this.opvalue = props.native;
    return {
      item: { ...items },
      field,
      itype: items.itype.trim(),
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
    this.error = !!err;
    this.errorString = this.error ? err : "";
    //    this.setState({errorString: this.errorString});
    return this.errorString;
  }

  getKey(index) {
    return this.props.index + (index !== undefined ? `/${index}` : "");
  }

  checkRules(value) {
    const rules = this.state.rules;
    if (!rules) return false;
    try {
      for (const rule of rules) {
        const check = rule(value, t);
        if (check !== true) return this.setErr(check);
      }
    } catch (e) {
      console.log("error in check rules:", e);
    }
    return this.setErr("");
  }

  uniqueTableRule(val) {
    const table = this.props.table;
    const field = this.props.field;
    if (!table) return true;
    const v = ("" + val).trim();
    const found = table.filter((i) => ("" + i[field]).trim() == v);
    return found.length <= 1 || this.t("This item can only be once per table in this field!");
  }

  onChangeValue(value, e) {
    if (this.check(value)) value = this.change(value);
    //    console.log(_value, value, this.state.ovalue, this.props.attr, this.errorString);
    this.setState({ value });
    if (this.state.item.onClick) this.state.item.onClick(e || value, this.props, Iob);
    if (this.props.field !== "$undefined")
      Iob.setStore.updateInativeValue({ attr: this.props.attr, value });
  }

  onChangeEvent(event) {
    this.onChangeValue(event.target.value, event);
  }

  /*   componentDidMount() {
    console.log("componentDidMount:", this.getKey(), this.state);
  }
 */
  /* 
    <div v-if="cToolItem.label" v-text="cToolItem.label" class="subtitle-2" />
    <div
      v-if="Array.isArray(cToolItem.text)"
      v-html="cToolItem.text.join('<br>')"
      class="caption"
    />
    */

  stringToArrayComma(value = []) {
    //    const { value } = this.props;
    const res = this.stringToArray(value);
    //    console.log("stringToArray", value, res);
    return res;
  }

  stringToArray(val, what = ",") {
    if (typeof val !== "string") return val;
    const ret = val.split(what).map((i) => i.trim());
    if (ret.length == 1 && !ret[0]) ret.splice(0, 1);
    //    console.log(val, ret);
    return ret;
  }

  uniqueTableRule(val, ...args) {
    console.log("uniqueTableRule", val, ...args);
    const { table, field } = this.props;
    if (!table || !field) return true;
    const v = ("" + val).trim();
    const found = table.filter((i) => ("" + i[field]).trim() == v);
    return found.length < 1 || t("This item can only be once per table in this field!");
  }

  onlyWords(val) {
    if (Array.isArray(val)) val = val[0];
    //      debugger;
    return (
      !!val.match(/^[\u00C0-\u017Fa-zA-Z0-9_\-\@\$\/]+$/) ||
      t("Only letters, numbers and `_ - @ $ /` are allowed!")
    );
  }

  $text(item) {
    const { items, split } = splitProps(item, "label|text|html");
    const { value } = this.state;
    if (Array.isArray(split.text)) split.text = split.text.join("");
    if (Array.isArray(split.html)) split.html = split.html.join("<br>");
    if (!split.text && !split.html && !split.label && value !== undefined && value !== null)
      split.text = value.toString();
    return Object.keys(split).map((n, index) => {
      switch (n) {
        case "label":
          return (
            <Typography key={this.getKey(index)} {...items} variant={items.lvariant || "subtitle1"}>
              {split.label}
            </Typography>
          );
        case "text":
          return (
            <Typography key={this.getKey(index)} {...items}>
              {split.text}
            </Typography>
          );
        case "html":
          return <HtmlComponent key={this.getKey(index)} {...items} html={split.html} />;
        default:
          return null;
      }
    });
  }

  $html(item) {
    const { items, split } = splitProps(item, "label|text");
    const { value } = this.state;
    //    console.log("html:", split);
    if (Array.isArray(split.text)) split.text = split.text.join("");
    if (!split.text && !split.label && value !== undefined && value !== null)
      split.text = value.toString();
    return Object.keys(split).map((n, index) => {
      switch (n) {
        case "label":
          return (
            <Typography key={this.getKey(index)} {...items} variant={items.lvariant || "subtitle1"}>
              {split.label}
              <br />
            </Typography>
          );
        case "text":
          return <HtmlComponent key={this.getKey(index)} {...items} html={split.text} />;
        default:
          return null;
      }
    });
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
    const { value } = this.state;
    const key = this.getKey();
    const sw = (
      <FormControl required /* className={classes.formControl} */>
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
          onChange={(e) => this.onChangeEvent(e)}
          {...rest}
        />
        {hint || this.errorString ? (
          <FormHelperText>{this.errorString || hint}</FormHelperText>
        ) : null}
      </FormControl>
    );
    return Iob.AddIcon(prependIcon, sw);
  }

  $switch(item) {
    this.change = (value) => !this.state.value;
    const { tooltip, label, labelPlacement, prependIcon, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(rest, { size: "medium", color: "primary", key });
    const sw = (
      <FormControlLabel
        control={
          <Switch {...items} checked={!!this.state.value} onChange={(e) => this.onChangeEvent(e)} />
        }
        label={label}
        labelPlacement={labelPlacement || "end"}
      />
    );
    return Iob.AddTooltip(tooltip, Iob.AddIcon(prependIcon, sw));
  }

  $checkbox(item) {
    this.change = (value) => !this.state.value;
    const { tooltip, label, labelPlacement, prependIcon, ...rest } = item;
    const key = this.getKey();
    const { color, ...items } = defaultProps(rest, { size: "medium", color: "primary", key });
    //    console.log("Color:", color);
    const sw = (
      <FormControlLabel
        control={
          <Checkbox
            {...items}
            checked={!!this.state.value}
            onChange={(e) => this.onChangeValue(!this.state.value)}
            color={color}
          />
        }
        label={label}
        labelPlacement={labelPlacement || "end"}
        color={color}
      />
    );
    return Iob.AddTooltip(tooltip, Iob.AddIcon(prependIcon, sw));
  }

  $select(item) {
    const {
      label,
      prependIcon,
      required,
      hint,
      defaultValue,
      tooltip,
      fullWidth = true,
      ...rest
    } = item;
    const key = this.getKey();
    const items = defaultProps(rest, { size: "medium", color: "primary", key });
    const { iselect = [{ value: "", label: "...loading" }] } = this.state;
    const oselect = {};
    iselect.map(i => oselect[i.value] = i.label)
    const value = this.state.value || "";
    //    console.log("select:", `'${value}'`, key, iselect, items);
    const sw = (
      <Autocomplete
        value={value}
        options={iselect}
        id={key}
        disableClearable
        getOptionSelected ={(o, v) => o.value == v}
        onChange= {(e, v) => this.onChangeValue(v.value, e)}
        getOptionLabel={(option) => typeof option === "object" ? option.label : oselect[option]}
        renderInput={(params) => (
          <TextField {...params} label={label} size="small" />
        )}
      ></Autocomplete>
      /*       <FormControl
        required
        fullWidth={fullWidth}
        margin="dense"
        hiddenLabel={!label}
        size="small" 
      >
        {label && (
          <InputLabel id={key + "-label"} shrink required={required} htmlFor={key}>
            {label}
          </InputLabel>
        )}
        <Select
          labelId={key + "-label"}
          id={key}
          {...items}
          value={value}
          onChange={(e) => this.onChangeEvent(e)}
          name={label}
          inputProps={{ id: key }}
        >
          {iselect.map((i, index) => (
            <option value={i.value} key={`_${index}_${i.label}_`}>
              {i.label}
            </option>
          ))}
        </Select>
        {hint ? <FormHelperText>{hint}</FormHelperText> : null}
      </FormControl>
 */
    );
    return Iob.AddIcon(prependIcon, Iob.AddTooltip(tooltip, sw));
  }

  $chips(item) {
    const { prependIcon, hint, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(rest, { size: "medium", color: "primary", key });
    let sel = this.state.value;
    if (!Array.isArray(sel)) {
      if (typeof sel === "string") {
        sel = this.stringToArrayComma(sel);
      } else sel = [];
    }
    //    console.log("chips:", sel, items);
    const sw = (
      <InputChips
        helperText={this.error ? this.errorString : hint}
        value={sel}
        error={this.error}
        onAdd={(chip) => {
          console.log("onAdd:", chip, this.checkRules(chip));
          this.onChangeValue(this.state.value.concat(chip));
        }}
        onDelete={(label, index) => {
          //          console.log("onDelete:", label, index, this.props.value);
          let a = new Array(...this.state.value);
          a.splice(index, 1);
          this.onChangeValue(a);
        }}
        {...items}
      />
    );
    return Iob.AddIcon(prependIcon, sw);
  }

  $table(item) {
    return (
      <ConfigTable
        index={this.getKey()}
        item={item}
        app={this.props.app}
        inative={this.props.value}
        settings={this.props.settings}
        attr={this.props.attr}
        rows={this.props.value}
        columns={item.items}
        {...item}
      />
    );
  }

  $icon(item) {
    //    this.change = (value) => !this.props.value;
    //    const { tooltip, label, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(item, { size: "medium", color: "primary", key });
    return <Iob.IButton key={key} {...items} />;
  }

  $button(item) {
    //    this.change = (value) => !this.props.value;
    //    const { tooltip, label, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(item, { size: "medium", color: "primary", key });
    return <Iob.TButton key={key} {...items} />;
  }

  $password(item) {
    return this.$string(item, "password");
  }

  $string(item, type) {
    type = type || "text";
    const { prependIcon, hint, __chackItem, defaultValue, ...drest } = item;
    const rest = defaultProps(drest, {
      size: "medium",
      id: this.getKey(),
    });
    let value = this.state.value;
    if (value === null || value === undefined) value = "";
    const inputProps = rest.inputProps || {};
    if (hint || this.errorString) rest.helperText = this.error ? this.errorString : hint;
    return Iob.AddIcon(
      prependIcon,
      <TextField
        value={value}
        {...rest}
        error={this.error}
        type={type}
        onChange={(e) => this.onChangeEvent(e)}
      />
    );
  }

  $log(item) {
    return <ConfigLog item={this.state.item} />;
  }

  $number(item) {
    let { min, max, fixed, zero, ...items } = item;
    min = typeof min === "number" ? min : Number.NEGATIVE_INFINITY;
    max = typeof max === "number" ? max : Number.POSITIVE_INFINITY;
    let value = this.state.value;
    this.check = (value) => {
      this.error = false;
      let val = fixed ? parseInt(value) : parseFloat(value);
      if (typeof value !== "number") {
        if (val === NaN && !value) val = 0;
      }
      // console.log("number", value, val, item);
      if (val === NaN || val.toString() != value)
        this.setErr(t(fixed ? "Not an integer: %s" : "Not a number: %s", `'${value}'`));
      else if (!zero || val !== 0) {
        if (val < min) this.setErr(t("value must not be smaller than %s!", min));
        else if (val > max) this.setErr(t("value must not be bigger than %s!", max));
        else if (fixed && parseFloat(value) != val) this.setErr(t("number need to be an integer!"));
      }
      return !this.error;
    };
    this.change = (value) => (fixed ? parseInt(value) : parseFloat(value));
    this.check(value);
    return this.$string(items);
  }

  $state(item) {
    const { name, ...items } = item;
    const key = this.getKey();
    return <EditState item={items} fKey={key} name={name} />;
  }

  render() {
    //    if (!itemR) return itemR = this.state.item;
    //    console.log(this.props.index);
    const { ieval, itype, item } = this.state;
    const nitem = Object.assign({}, item);
    const { disabled } = nitem;
    if (typeof disabled === "string")
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
          Iob.logSnackbar("error;ieval error %s", e);
          console.log("ieval error:", e);
        }

    if (
      isPartOf(
        itype,
        "$state|$text|$html|$number|$string|$password|$switch|$button|$checkbox|$select|$chips|$table|$textarea|$icon|$log"
      ) &&
      typeof this[itype] === "function"
    )
      return this[itype](nitem);
    return <span>{this.props.index + ":" + JSON.stringify(nitem, null, 2)}</span>;
  }
}

/* export default connect(
  (state) => {
    const { ...all } = state;
    return { ...all };
  }
)(ConfigItem);
 */
export default ConfigItem;
