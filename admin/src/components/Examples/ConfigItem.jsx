import React, { useRef } from "react";
//import { withStyles, makeStyles } from "@material-ui/core/styles";
//import I18n from "@iobroker/adapter-react/i18n";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
import { Iob, t, isPartOf, connect, makeFunction } from "./Iob";

import {
  InputField,
  AddIcon,
  AddTooltip,
  IButton,
  TButton,
  HtmlComponent,
  MakeDroppable,
} from "./UiComponents";
import ConfigTable from "./ConfigTable";
import ConfigLog from "./ConfigLog";
import StateBrowser from "./StateBrowser";
import ConfigList from "./ConfigList";
import EditState from "./EditState";
import {
  Typography,
  Checkbox,
  FormControl,
  InputLabel,
  FormControlLabel,
  FormHelperText,
  Switch,
  TextField,
  TextareaAutosize,
  Chip,
} from "@material-ui/core";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";
//import { config } from "chai";
//import { createSolutionBuilderWithWatch, isNoSubstitutionTemplateLiteral } from "typescript";
//import { restore } from "sinon";
//import { SIGTSTP } from "constants";
import { useDrag, useDrop } from "react-dnd";

const CardChip = ({ id, classes, chipsId, label, index, moveCard, style }) => {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: chipsId,
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      console.log(dragIndex, hoverIndex);
      // Time to actually perform the action
      moveCard && moveCard(dragIndex, hoverIndex);
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    item: { type: chipsId, id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));
  return <Chip classes={classes} ref={ref} label={label} style={{ ...style, opacity }} />;
};
class ConfigItem extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    this.events = {};
    this.state = this.createState(props);
    this.error = false;
    this.errorString = "";
    this.onChangeFun = () => null;
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
      droppable,
      isOverProps,
      convertOld,
      changeItems,
      onStateChange,
      onObjectChange,
      ...citems
    } = props.item;
    let { canDropHere, dropAction, ...items } = citems;
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
      const fun =
        typeof convertOld !== "function"
          ? makeFunction(convertOld, this, "$", "props", "Iob")
          : convertOld;
      let res = undefined;
      try {
        res = fun(state.value, props, Iob);
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
      droppable,
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
    this.error = !!err;
    this.errorString = this.error ? err : "";
    //    this.setState({errorString: this.errorString});
    if (this.oerror != this.errorString) {
      this.oerror = this.errorString;
      this.forceUpdate();
    }
    return this.errorString;
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
        check = rule(value, t);
        if (check !== true) break;
      }
    } catch (e) {
      console.log("error in check rules:", e);
      return e.toString();
    }
    return check;
  }

  checkRules(value) {
    const rules = this.state.rules;
    let check = this.testRules(value);
    this.setErr(check === true ? "" : check);
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

  onChangeValue(value, e) {
    if (this.check(value)) value = this.change(value);
    //    console.log(value, this.props.attr, `'${this.errorString}'`);
    this.setState({ value });
    //    debugger;
    if (typeof this.state.item.onClick === "function") this.state.item.onClick(e, value, Iob);
    if (this.props.field !== "$undefined" && this.props.onUpdateValue)
      this.props.onUpdateValue(this.props.attr, value);
  } /*   componentDidMount() {
    console.log("componentDidMount:", this.getKey(), this.state);
  }
 */ /* 
    <div v-if="cToolItem.label" v-text="cToolItem.label" class="subtitle-2" />
    <div
      v-if="Array.isArray(cToolItem.text)"
      v-html="cToolItem.text.join('<br>')"
      class="caption"
    />
    */

  /*   onChangeEvent(event) {
    this.onChangeValue(event.target.value, event);
  }

 */

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
          onChange={(e) => this.onChangeValue(e.target.value, e)}
          {...rest}
        />
        {hint || this.errorString ? (
          <FormHelperText>{this.errorString || hint}</FormHelperText>
        ) : null}
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
            onChange={(e) => this.onChangeValue(!this.state.value, e)}
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
            onChange={(e) => this.onChangeValue(!this.state.value)}
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
    const helper = this.errorString ? this.errorString : hint ? hint : "";
    //    console.log("select:", `'${value}'`, key, iselect, items);
    const sw = (
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
          onChange={(e, v) => this.onChangeValue(v.value, e)}
          getOptionLabel={(option) =>
            typeof option === "object" ? option.label : oselect[option] || ""
          }
          renderInput={(params) => <TextField {...params} label={label} size="small" />}
        ></Autocomplete>
        {helper ? <FormHelperText>{helper}</FormHelperText> : null}
      </FormControl>
    );
    return AddIcon(prependIcon, AddTooltip(tooltip, sw));
  }

  $chips(item) {
    let {
      prependIcon,
      droppable,
      dropAction,
      hint,
      label,
      size = "medium",
      color = "primary",
      placeholder = "",
      required,
      disabled,
      fullWidth = true,
      margin = "none",
      ...items
    } = item;
    const key = this.getKey();
    let { value, iselect = [] } = this.state;
    if (!Array.isArray(value)) {
      if (typeof value === "string") {
        value = Iob.stringToArrayComma(value);
      } else value = [];
    }
    if (value.length) placeholder = "";
    const helperText = this.error ? this.errorString : hint;
    let sw = (
      <FormControl
        {...{ required, size, margin, disabled }}
        hiddenLabel={!label}
        error={this.error}
        fullWidth={fullWidth}
      >
        <MakeDroppable dropZone={key}>
          <Autocomplete
            value={value}
            multiple
            id={key}
            options={iselect}
            freeSolo
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <CardChip
                  label={option}
                  chipsId={key}
                  moveCard={(...args) => console.log(...args)}
                  onClick={(e) => this.onChangeFun(option)}
                  {...getTagProps({ index })}
                  key={key + index}
                />
              ))
            }
            renderInput={(params) => {
              this.onChangeFun =
                params.inputProps && params.inputProps.onChange
                  ? (v) => params.inputProps.onChange({ target: { value: v } })
                  : () => null;

              return (
                <TextField
                  {...params}
                  label={label}
                  onKeyUp={(e) => (e.key == "Escape" ? this.onChangeFun("") : null)}
                  fullWidth={fullWidth}
                  placeholder={placeholder}
                />
              );
            }}
            onChange={(e, v) => {
              v.map((c) => this.checkRules(c));
              this.onChangeValue(v, e);
            }}
          />
        </MakeDroppable>
        {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
      </FormControl>
    );
    return AddIcon(prependIcon, sw);
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
    return <TButton key={key} size={size} color={color} {...items} />;
  }

  $password(item) {
    return this.$string(item, "password");
  }

  $string(item, type) {
    type = type || "text";
    const key = this.getKey();
    const {
      prependIcon,
      hint,
      label,
      __chackItem,
      defaultValue,
      inputProps = {},
      size = "medium",
      ...rest
    } = item;
    let value = this.state.value;
    if (value === null || value === undefined) value = "";
    const props = { value, type, hint, label, inputProps };
    return AddIcon(
      prependIcon,
      <InputField
        size={size}
        id={key}
        {...props}
        {...rest}
        errorString={this.error ? this.errorString : ""}
        onChange={(e) => this.onChangeValue(e.target.value, e)}
      />
    );
  }

  $log(item) {
    return <ConfigLog item={this.state.item} />;
  }

  $stateBrowser(item) {
    return <StateBrowser item={this.state.item} />;
  }

  $number(item) {
    //    console.log(item);
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
        this.setErr(t(fixed ? "Not an integer: {0}" : "Not a number: {0}", `'${value}'`));
      else if (!zero || val !== 0) {
        if (val < min) this.setErr(t("value must not be smaller than {0}!", min));
        else if (val > max) this.setErr(t("value must not be bigger than {0}!", max));
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
    return <EditState item={items} iKey={this.getKey()} name={name} />;
  }

  render() {
    //    if (!itemR) return itemR = this.state.item;
    //    console.log(this.props.index);
    const { ieval, itype, item, canDropHere, dropAction, droppable, isOverProps } = this.state;
    const nitem = Object.assign({}, item);
    const { disabled } = nitem;
    if (typeof disabled === "function") nitem.disabled = disabled(this.props, Iob);
    else if (typeof disabled === "string")
      try {
        const fun = Iob.makeFunction(disabled, this, "props,Iob");
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
        "$grid|$stateBrowser|$object|$state|$text|$html|$number|$string|$password|$switch|$button|$checkbox|$select|$chips|$table|$textarea|$icon|$log"
      ) && typeof this[itype] === "function" ? (
        this[itype](nitem)
      ) : (
        <span>{this.props.index + ":" + JSON.stringify(nitem, null, 2)}</span>
      );
    if (droppable)
      sw = (
        <MakeDroppable
          dropZone={droppable}
          canDropHere={canDropHere}
          dropAction={dropAction}
          isOverProps={isOverProps}
        >
          {sw}
        </MakeDroppable>
      );

    return sw;
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
