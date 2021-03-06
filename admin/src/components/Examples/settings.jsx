import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Input from "@material-ui/core/Input";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import I18n from "@iobroker/adapter-react/i18n";

/**
 * @type {() => Record<string, import("@material-ui/core/styles/withStyles").CreateCSSProperties>}
 */


/**
 * @typedef {object} SettingsProps
 * @property {Record<string, string>} classes
 * @property {Record<string, any>} native
 * @property {(attr: string, value: any) => void} onChange
 */

/**
 * @typedef {object} SettingsState
 * @property {undefined} [dummy] Delete this and add your own state properties here
 */

/**
 * @extends {React.Component<SettingsProps, SettingsState>}
 */
class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  /**
   * @param {AdminWord} title
   * @param {string} attr
   * @param {string} type
   */
  renderInput(title, attr, type) {
    return (
      <TextField
        label={I18n.t(title)}
        className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
        value={this.props.native[attr]}
        type={type || "text"}
        onChange={(e) => this.props.onChange(attr, e.target.value)}
        margin="normal"
      />
    );
  }

  /**
   * @param {AdminWord} title
   * @param {string} attr
   * @param {{ value: string; title: AdminWord }[]} options
   * @param {React.CSSProperties} [style]
   */
  renderSelect(title, attr, options, style) {
    return (
      <FormControl
        className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
        style={{
          paddingTop: 5,
          ...style,
        }}
      >
        <Select
          value={this.props.native[attr] || ""}
          onChange={(e) => this.props.onChange(attr, e.target.value === "_" ? "" : e.target.value)}
          input={<Input name={attr} id={attr + "-helper"} />}
        >
          {options.map((item) => (
            <MenuItem key={"key-" + item.value} value={item.value || "_"}>
              {I18n.t(item.title)}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>{I18n.t(title)}</FormHelperText>
      </FormControl>
    );
  }

  /**
   * @param {string} AdminWord
   * @param {string} attr
   * @param {React.CSSProperties} [style]
   */
  renderCheckbox(title, attr, style) {
    return (
      <FormControlLabel
        key={attr}
        style={{
          paddingTop: 5,
          ...style,
        }}
        className={this.props.classes.controlElement}
        control={
          <Checkbox
            checked={this.props.native[attr]}
            onChange={() => this.props.onChange(attr, !this.props.native[attr])}
            color="primary"
          />
        }
        label={I18n.t(title)}
      />
    );
  }

  render() {
    return (
      <div className={this.props.classes.tab}>
        {this.renderCheckbox("option1", "option1")}
        <br />
        {this.renderSelect("select1", "select1", [
          { title: "first", value: 1 },
          { title: "second", value: 2 },
        ])}
        <br />
        {this.renderInput("option2", "option2", "text")}
      </div>
    );
  }
}

export default withStyles(styles)(Settings);
