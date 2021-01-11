import React from "react";
//import { withStyles, makeStyles } from "@material-ui/core/styles";
//import I18n from "@iobroker/adapter-react/i18n";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
import { Iob, splitProps, defaultProps, t, isPartOf, HtmlComponent, connect } from "./Iob";
import InputChips from "./InputChips";
import ConfigTable from "./ConfigTable";
import ConfigLog from "./ConfigLog";
import { withSnackbar } from "notistack";
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
//import { config } from "chai";
//import { createSolutionBuilderWithWatch, isNoSubstitutionTemplateLiteral } from "typescript";
//import { restore } from "sinon";
//import { SIGTSTP } from "constants";

/**
 * @typedef {object} SettingsProps
 * @property {Record<string, string>} classes
 * @property {Record<string, any>} inative
 * @property {Record<string, any>} item
 * @property {(field: string, value: any) => void} onChange
 */

/**
 * @typedef {object} SettingsState
 * @property {undefined} [dummy] Delete this and add your own state properties here
 */

/**
 * @extends {Iob.Component<SettingsProps, SettingsState>}
 */
class ConfigItem extends React.Component {
  constructor(props) {
    super(props);
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

  createState(props) {
    const { field, rules, ieval, iselect, convertold, ...items } = props.item;
    const { onClick } = items;
    const that = this;

    function processRules(rules) {
      //    if (state.ieval)
      //      state.ieval(state.item, props.inative);
      const values = (Array.isArray(rules) && rules) || (rules && [rules]) || null;
      return values && values.map((i) => that.makeFunction(i, that, "$", "t"));
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

    const state = {};

    if (onClick && typeof onClick !== "function") {
      if (typeof onClick === "string") {
        const fun = this.makeFunction(onClick, this, "event", "props", "Iob");
        items.onClick = ((e) => {
          try {
            fun(e, this.props, Iob);
          } catch (e) {
            console.log(`onClick error ${e} in function generatied from: '${onClick}'`);
            Iob.logSnackbar("error;onClick error %s in function generated from: %s", e, onClick);
          }
        }).bind(this);
      }
    }
    //    const { items, split } = splitProps(pitems, "xs|xl|sm|md|lg");
    //    if (!split.sm && cols) split.sm = cols;
    //    if (!split.sm) split.sm = 3;
    if (convertold) {
      const fun =
        typeof convertold !== "function"
          ? this.makeFunction(convertold, this, "$", "props", "Iob")
          : convertold;
      let res = undefined;
      try {
        res = fun(props.value, props, Iob);
      } catch (e) {
        Iob.logSnackbar("error;convertold error %s", e);
      }
      if (res != null && res != undefined && res !== props.value) {
        //        console.log("convertOld:", this.props.attr, props.value, res);
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
            fun = this.makeFunction(sel, this, "$", "props", "Iob");
            rsel = fun(this.props.value, this.props, Iob);
            //            console.log("select executed get function:", sel, rsel);
            if (Array.isArray(rsel)) sel = rsel;
          } catch (e) {
            console.log("got select function error:", e);
          }
        } else sel = makeSel(sel, ";");
        state.iselect = sel;
      }
    } else if (sel) state.iselect = [sel];

    //    this.opvalue = props.native;
    return {
      item: { ...items },
      field,
      itype: items.itype,
      ieval:
        ieval && typeof ieval === "string"
          ? this.makeFunction(ieval, this, "$", "props", "Iob")
          : ieval,
      rules: processRules(rules),
      ...state,
    };
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

  onChangeValue(value) {
    const _value = value;
    if (this.check(value)) value = this.change(value);
    console.log(_value, value, this.state.ovalue, this.props.attr, this.errorString);
    Iob.setStore.updateInativeValue({ attr: this.props.attr, value });
    this.setState({ value });
  }

  onChangeEvent(event) {
    this.onChangeValue(event.target.value);
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
  makeFunction(rule, that, ...args) {
    that = that || this;

    if (typeof rule == "function") return rule;
    // else if (Array.isArray(rule)) {
    //   rule = rule.map(i => i.trim());
    else if (typeof rule == "object") {
      if (typeof rule.regexp == "string") {
        const m = rule.regexp.match(/^\/(.*)\/([gimy]*)$/);
        const re = m ? new RegExp(...m.slice(1, 3)) : null;
        let f;
        let r = t(rule.message);
        if (re) {
          f = (v) => {
            if (Array.isArray(v)) v = v.slice(-1)[0];
            return !!(v || "").match(re) || r;
          };
        } else {
          f = (v) => {
            if (Array.isArray(v)) v = v.slice(-1)[0];
            // console.log(v);
            return (v || "").indexOf(rule.regexp) >= 0 || r;
          };
        }
        return f.bind(that);
        /*       } else if (typeof rule.number == "string") {
        const r = this.$t(rule.number);
        // const m = rule.fixed ? /^[\d\-+]$/ : /^[\d\-+.,e]$/i;
        const min =
          rule.min !== undefined && !isNaN(Number(rule.min))
            ? Number(rule.min)
            : Number.NEGATIVE_INFINITY;
        const max =
          rule.max !== undefined && !isNaN(Number(rule.max))
            ? Number(rule.max)
            : Number.POSITIVE_INFINITY;
        const has = Array.isArray(rule.has) ? rule.has : [];
        const n = rule.fixed ? parseInt : parseFloat;
        // const m = rule.regexp.match(/^\/(.*)\/([gimy])?$/);
        // const re = m ? new RegExp(...m.slice(1, 3)) : null;
        // let ;
        // let r = this.$t(rule.message);
        const f = (v) => {
          if (Array.isArray(v)) v = v.slice(-1)[0];
          // console.log(v);
          const x = n(v);
          return (!isNaN(x) && ((x >= min && x <= max) || has.indexOf(x) >= 0)) || r;
        };
        return f.bind(that);
 */
      }
    } else if (typeof rule == "string" && rule.trim()) {
      if (typeof that[rule] == "function") return that[rule].bind(that);
      rule = [...args, rule.trim()];
      try {
        let b = rule[rule.length - 1];
        b = b.startsWith("return ") || b.startsWith("{") ? b : `return ${b};`;
        rule[rule.length - 1] = b;
        const t = t;
        const React = React;
        const f = new Function(...rule);
        return f.bind(that);
      } catch (e) {
        console.log(`makeFunction error ${e} in function generation with: ${rule}`);
        Iob.logSnackbar("error;makeFunction error %s in function generation with: %s", e, rule);
      }
    } else console.log("makeFunction - Invalid function content in rule:", rule);
    return null;
  }

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

  text(item) {
    const { items, split } = splitProps(item, "label|text|html");
    if (Array.isArray(split.text)) split.text = split.text.join("");
    if (Array.isArray(split.html)) split.html = split.html.join("<br>");
    if (
      !split.text &&
      !split.html &&
      !split.label &&
      this.props.value !== undefined &&
      this.props.value !== null
    )
      split.text = this.props.value.toString();
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

  textarea(item) {
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
          value={
            typeof this.props.value === "string"
              ? this.props.value
              : (this.props.value && this.props.value.toString()) || ""
          }
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

  switch(item) {
    this.change = (value) => !this.props.value;
    const { tooltip, label, labelPlacement, prependIcon, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(rest, { size: "medium", color: "primary", key });
    const sw = (
      <FormControlLabel
        control={
          <Switch {...items} checked={!!this.props.value} onChange={(e) => this.onChangeEvent(e)}/>
        }
        label={label}
        labelPlacement={labelPlacement || "end"}
      />
    );
    return Iob.AddTooltip(tooltip, Iob.AddIcon(prependIcon, sw));
  }

  checkbox(item) {
    this.change = (value) => !this.props.value;
    const { tooltip, label, labelPlacement, prependIcon, ...rest } = item;
    const key = this.getKey();
    const { color, ...items } = defaultProps(rest, { size: "medium", color: "primary", key });
    //    console.log("Color:", color);
    const sw = (
      <FormControlLabel
        control={
          <Checkbox
            {...items}
            checked={!!this.props.value}
            onChange={(e) => this.onChangeEvent(e)}
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

  iselect(item) {
    const { label, prependIcon, required, hint, defaultValue, tooltip, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(rest, { size: "medium", color: "primary", key });
    const { iselect = [{ value: "", label: "...loading" }] } = this.state;
    //  console.log("select:", sel, items);
    const sw = (
      <FormControl required /* className={classes.formControl} */>
        {label && (
          <InputLabel shrink required={required} htmlFor={key}>
            {label}
          </InputLabel>
        )}
        <Select
          {...items}
          value={this.props.value}
          onChange={(e) => this.onChangeEvent(e)}
          name={label}
          inputProps={{ id: key }}
        >
          {iselect.map((i, index) => (
            <option value={i.value} key={`_${index}_${i.value}_`}>
              {i.label}
            </option>
          ))}
        </Select>
        {hint ? <FormHelperText>{hint}</FormHelperText> : null}
      </FormControl>
    );
    return Iob.AddIcon(prependIcon, Iob.AddTooltip(tooltip, sw));
  }

  chips(item) {
    const { prependIcon, hint, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(rest, { size: "medium", color: "primary", key });
    let sel = this.props.value;
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
          this.onChangeValue(this.props.value.concat(chip));
        }}
        onDelete={(label, index) => {
          //          console.log("onDelete:", label, index, this.props.value);
          let a = new Array(...this.props.value);
          a.splice(index, 1);
          this.onChangeValue(a);
        }}
        {...items}
      />
    );
    return Iob.AddIcon(prependIcon, sw);
  }

  table(item) {
    return (
      <ConfigTable
        index={this.getKey()}
        item={item}
        app={this.props.app}
        native={this.props.value}
        settings={this.props.settings}
        attr={this.props.attr}
        rows={this.props.value}
        columns={item.items}
        {...item}
      />
    );
  }

  icon(item) {
    //    this.change = (value) => !this.props.value;
    //    const { tooltip, label, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(item, { size: "medium", color: "primary", key });
    return <Iob.IButton key={key} {...items} />;
  }

  button(item) {
    //    this.change = (value) => !this.props.value;
    //    const { tooltip, label, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(item, { size: "medium", color: "primary", key });
    return <Iob.TButton key={key} {...items} />;
  }

  password(item) {
    return this.string(item, "password");
  }

  string(item, type) {
    type = type || "text";
    const { prependIcon, hint, __chackItem, defaultValue, ...drest } = item;
    const rest = defaultProps(drest, {
      size: "medium",
      id: this.getKey(),
    });
    let value = this.props.value;
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

  log(item) {
    return <ConfigLog item={this.state.item} />;
  }

  number(item) {
    let { min, max, fixed, zero, ...items } = item;
    min = typeof min === "number" ? min : Number.NEGATIVE_INFINITY;
    max = typeof max === "number" ? max : Number.POSITIVE_INFINITY;
    let value = this.props.value;
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
    return this.string(items);
  }

  html(item) {
    const { items, split } = splitProps(item, "label|text");
    if (Array.isArray(split.text)) split.text = split.text.join("");
    if (!split.text && !split.label && this.props.value !== undefined && this.props.value !== null)
      split.text = this.props.value.toString();
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
  render() {
    //    if (!itemR) return itemR = this.state.item;
    //    console.log(this.props.index);
    const { ieval, itype, item } = this.state;
    if (typeof ieval === "function") {
      try {
        ieval(this.props.value, this.props, Iob);
      } catch (e) {
        Iob.logSnackbar("error;ieval error %s", e);
        console.log("ieval error:", e);
      }
    }
    if (
      isPartOf(
        itype,
        "text|html|number|string|password|switch|button|checkbox|iselect|chips|table|textarea|icon|log"
      ) &&
      typeof this[itype] === "function"
    )
      return this[itype](item);
    return <span>{this.props.index + ":" + JSON.stringify(item, null, 2)}</span>;
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
