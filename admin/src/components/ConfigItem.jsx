import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import I18n from "@iobroker/adapter-react/i18n";
import GenericApp from "@iobroker/adapter-react/GenericApp";
import { Components, styles, splitProps, defaultProps, t, isPartOf } from "./Components";
import InputChips from "./InputChips";
import ConfigTable from "./ConfigTable";
import HtmlComponent from "./HtmlComponent";
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
import { config } from "chai";
import { createSolutionBuilderWithWatch, isNoSubstitutionTemplateLiteral } from "typescript";
import { restore } from "sinon";
import { SIGTSTP } from "constants";
import { bindActionCreators } from "redux";
import { ioBroker } from "../rtk/reducers";
import { connect } from "react-redux";

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
 * @extends {React.Component<SettingsProps, SettingsState>}
 */
class ConfigItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.createState(props);
    this.error = false;
    this.errorString = "";
    this.processRules(props, this.state);
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
    const { field, ...pitem } = props.item;
    const { rules, ieval, convertold, ...items } = pitem;
    const { onClick } = items;
    if (onClick)
      items.onClick =
        onClick && typeof onClick !== "function"
          ? this.makeFunction(onClick, this, "item", "native")
          : onClick;
    //    const { items, split } = splitProps(pitems, "xs|xl|sm|md|lg");
    //    if (!split.sm && cols) split.sm = cols;
    //    if (!split.sm) split.sm = 3;
    this.opvalue = props.native;
    return {
      item: { ...items },
      field,
      itype: items.itype,
      ieval:
        ieval && typeof ieval !== "function"
          ? this.makeFunction(ieval, this, "item", "inative")
          : ieval,
      convertold:
        convertold && typeof convertold !== "function"
          ? this.makeFunction(convertold, this, "item", "inative")
          : convertold,
      select: items.select,
      rules: this.processRules(rules),
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

 */ processRules(
    rules
  ) {
    //    if (state.ieval)
    //      state.ieval(state.item, props.inative);
    if (!rules) return null;
    const values = Array.isArray(rules) ? rules : [rules];
    return values.map((i) => this.makeFunction(i, this, "$", "t"));
  }

  setErr(err) {
    this.error = !!err;
    this.errorString = this.error ? err : "";
    //    this.setState({errorString: this.errorString});
    return this.errorString;
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
    this.props.updateInativeValue({ attr: this.props.attr, value });
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
        const f = new Function(...rule);
        return f.bind(that);
      } catch (e) {
        console.log(`makeFunction error ${e} in function generation with: ${rule}`);
      }
    } else console.log("makeFunction - Invalid function content in rule:", rule);
    return null;
  }

  stringToArrayWith(val, what) {
    what = what || ",";
    if (typeof val === "string") {
      const ret = val.split(",").map((i) => i.trim());
      if (ret.length == 1 && !ret[0]) ret.splice(0, 1);
      // console.log(val, ret);
      return ret;
    }
    return val;
  }

  uniqueTableRule(val) {
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

  getKey(index) {
    return this.props.index + (index !== undefined ? `/${index}` : "");
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
    return Components.AddIcon(prependIcon, sw);
  }

  switch(item) {
    this.change = (value) => !this.props.value;
    const { tooltip, label, labelPlacement, prependIcon, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(rest, { size: "medium", color: "primary", key });
    const sw = (
      <FormControlLabel
        control={
          <Switch {...items} checked={!!this.props.value} onChange={(e) => this.onChangeEvent(e)} />
        }
        label={label}
        labelPlacement={labelPlacement || "end"}
      />
    );
    return Components.AddTooltip(tooltip, Components.AddIcon(prependIcon, sw));
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
    return Components.AddTooltip(tooltip, Components.AddIcon(prependIcon, sw));
  }

  select(item) {
    const { label, prependIcon, required, hint, select, defaultValue, tooltip, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(rest, { size: "medium", color: "primary", key });
    let sel = this.state.select;
    if (!Array.isArray(select)) {
      //      console.log("select=", sel, this.props.settings.props.ipAddresses);
      const def = { value: "", label: "" };
      if (typeof sel === "string") {
        if (sel.indexOf("|"))
          sel = sel
            .split("|")
            .map((i) => {
              const sp = i.split("=");
              if (sp.length == 2) return { value: sp[0], label: t(sp[1]) };
              else if (sp.length == 1) return { value: sp[0], label: sp[0] };
              else return def;
            });
        else if (sel.startsWith("{")) {
          const fun = this.makeFunction(sel, this, "item", "inative");
          let rsel = null;
          try {
            rsel = fun(item, this.props.native);
            //            console.log("select executed get function:", sel, rsel);
            if (Array.isArray(rsel)) sel = rsel;
          } catch (e) {
            console.log("got select function error:", e);
          }
        } else sel = [{ value: sel, label: sel }];
      }
    }
    if (!Array.isArray(sel)) sel = sel = [{ value: "", label: "...loading" }];
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
          {sel.map((i, index) => (
            <option value={i.value} key={`_${index}_${i.value}_`}>
              {i.label}
            </option>
          ))}
        </Select>
        {hint ? <FormHelperText>{hint}</FormHelperText> : null}
      </FormControl>
    );
    return Components.AddIcon(prependIcon, Components.AddTooltip(tooltip, sw));
  }

  stringToArrayWith(val, what = ",") {
    if (typeof val === "string") {
      const ret = val.split(what).map((i) => i.trim());
      if (ret.length == 1 && !ret[0]) ret.splice(0, 1);
      // console.log(val, ret);
      return ret;
    }
    return Array.isArray(val) ? val : val !== undefined && val !== null ? [val] : [];
  }

  chips(item) {
    const { prependIcon, hint, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(rest, { size: "medium", color: "primary", key });
    let sel = this.props.value;
    if (!Array.isArray(sel)) {
      if (typeof sel === "string") {
        sel = this.stringToArrayWith(sel);
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
    return Components.AddIcon(prependIcon, sw);
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
    return <Components.IButton key={key} {...items} />;
  }

  button(item) {
    //    this.change = (value) => !this.props.value;
    //    const { tooltip, label, ...rest } = item;
    const key = this.getKey();
    const items = defaultProps(item, { size: "medium", color: "primary", key });
    return <Components.TButton key={key} {...items} />;
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
    return Components.AddIcon(
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
    console.log(this.props.index);
    const { itype, ...item } = this.state.item;
    if (
      isPartOf(
        itype,
        "text|html|number|string|password|switch|button|checkbox|select|chips|table|textarea|icon"
      ) &&
      typeof this[itype] === "function"
    )
      return this[itype](item);
    return <span>{this.props.index + ":" + JSON.stringify(this.state.item, null, 2)}</span>;
  }
}

export default withSnackbar(
  connect(
    (state) => {
      const { ...all } = state;
      return { ...all };
    },
    (dispatch) => {
      const { updateInativeValue } = ioBroker.actions;
      return {
        ...bindActionCreators({ updateInativeValue }, dispatch),
      };
    }
  )(ConfigItem)
);
