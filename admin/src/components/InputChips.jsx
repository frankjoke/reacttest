

/**
 * Notice: Some code was adapted from Material-UI's text field.
 *         Copyright (c) 2014 Call-Em-All (https://github.com/callemall/material-ui)
 */
import React from "react";
import ReactDOM from "react-dom";
import {
  Input,
  FilledInput,
  OutlinedInput,
  InputLabel,
  Chip,
  FormControl,
  FormHelperText,
} from "@material-ui/core";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import blue from "@material-ui/core/colors/blue";
import Iob, { splitProps, styles, defaultProps, t, isPartOf } from "./Iob";
import cx from "classnames";

const variantComponent = {
  standard: Input,
  filled: FilledInput,
  outlined: OutlinedInput,
};

const keyCodes = {
  BACKSPACE: 8,
  DELETE: 46,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39
};

class InputChips extends React.Component {
  constructor(props) {
    super(props);
    if (props.defaultValue) {
      this.state.chips = props.defaultValue;
    }
    this.state = {
      chips: [],
      errorText: undefined,
      focusedChip: null,
      inputValue: "",
      isClean: true,
      isFocused: false,
      chipsUpdated: false,
      prevPropsValue: [],
    };

    this.labelRef = React.createRef();
    this.input = React.createRef();
  }

  componentDidMount() {
    if (this.props.variant === "outlined") {
      this.labelNode = ReactDOM.findDOMNode(this.labelRef.current);
      this.forceUpdate();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.inputBlurTimeout);
  }

  static getDerivedStateFromProps(props, state) {
    let newState = null;

    if (props.value && props.value.length !== state.prevPropsValue.length) {
      newState = { prevPropsValue: props.value };
      if (props.clearInputValueOnChange) newState.inputValue = "";
    }
    // if change detection is only needed for clearInputValueOnChange
    if (
      props.clearInputValueOnChange &&
      props.value &&
      props.value.length !== state.prevPropsValue.length
    )
      newState = { prevPropsValue: props.value, inputValue: "" };

    if (props.disabled) newState = { ...newState, focusedChip: null };

    if (!state.chipsUpdated && props.defaultValue)
      newState = { ...newState, chips: props.defaultValue };

    return newState;
  }

  /**
   * Blurs this component.
   * @public
   */
  blur() {
    this.input && this.actualInput.blur();
  }

  /**
   * Focuses this component.
   * @public
   */
  focus = () => {
    this.actualInput.focus();
    this.state.focusedChip != null && this.setState({ focusedChip: null });
  };

  handleInputBlur = (event) => {
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
    this.setState({ isFocused: false });
    if (this.state.focusedChip != null) {
      this.setState({ focusedChip: null });
    }
    const value = event.target.value;
    let addChipOptions;
    switch (this.props.blurBehavior) {
      case "add-or-clear":
        addChipOptions = { clearInputOnFail: true };
      // falls through
      case "add":
        if (this.props.delayBeforeAdd) {
          // Lets assume that we only want to add the existing content as chip, when
          // another event has not added a chip within 200ms .
          // e.g. onSelection Callback in Autocomplete case
          const numChipsBefore = (this.props.value || this.state.chips).length;
          this.inputBlurTimeout = setTimeout(() => {
            const numChipsAfter = (this.props.value || this.state.chips).length;
            if (numChipsBefore === numChipsAfter) {
              this.handleAddChip(value, addChipOptions);
            } else this.updateInput();
          }, 150);
        } else {
          this.handleAddChip(value, addChipOptions);
        }
        break;
      case "clear":
        this.updateInput();
        break;
    }
  };

  handleInputFocus = (event) => {
    this.setState({ isFocused: true });
    if (this.props.onFocus) this.props.onFocus(event);
  };

  handleKeyDown = (event) => {
    const { focusedChip } = this.state;
    this._keyPressed = false;
    this._preventChipCreation = false;
    if (this.props.onKeyDown) {
      // Needed for arrow controls on menu in autocomplete scenario
      this.props.onKeyDown(event);
      // Check if the callback marked the event as isDefaultPrevented() and skip further actions
      // enter key for example should not always add the current value of the inputField
      if (event.isDefaultPrevented()) {
        return;
      }
    }
    const chips = this.props.value || this.state.chips;
    if (
      this.props.newChipKeyCodes.indexOf(event.keyCode) >= 0 ||
      this.props.newChipKeys.indexOf(event.key) >= 0
    ) {
      const result = this.handleAddChip(event.target.value);
      if (result !== false) {
        event.preventDefault();
      }
      return;
    }

    switch (event.keyCode) {
      case keyCodes.BACKSPACE:
        if (event.target.value === "") {
          if (focusedChip != null) {
            this.handleDeleteChip(chips[focusedChip], focusedChip);
            focusedChip > 0 && this.setState({ focusedChip: focusedChip - 1 });
          } else this.setState({ focusedChip: chips.length - 1 });
        }
        break;
      case keyCodes.DELETE:
        if (event.target.value === "" && focusedChip != null) {
          this.handleDeleteChip(chips[focusedChip], focusedChip);
          focusedChip <= chips.length - 1 && this.setState({ focusedChip });
        }
        break;
      case keyCodes.LEFT_ARROW:
        if (focusedChip == null && event.target.value === "" && chips.length)
          this.setState({ focusedChip: chips.length - 1 });
        else if (focusedChip != null && focusedChip > 0)
          this.setState({ focusedChip: focusedChip - 1 });
        break;
      case keyCodes.RIGHT_ARROW:
        if (focusedChip != null && focusedChip < chips.length - 1)
          this.setState({ focusedChip: focusedChip + 1 });
        else this.setState({ focusedChip: null });
        break;
      default:
        this.setState({ focusedChip: null });
        break;
    }
  };

  handleKeyUp = (event) => {
    if (
      !this._preventChipCreation &&
      (this.props.newChipKeyCodes.indexOf(event.keyCode) >= 0 ||
        this.props.newChipKeys.indexOf(event.key) >= 0) &&
      this._keyPressed
    )
      this.updateInput();
    else this.updateInput(event.target.value);
    this.props.onKeyUp && this.props.onKeyUp(event);
  };

  handleKeyPress = (event) => {
    this._keyPressed = true;
    this.props.onKeyPress && this.props.onKeyPress(event);
  };

  handleUpdateInput = (e) => {
    this.props.inputValue == null && this.updateInput(e.target.value);
    this.props.onUpdateInput && this.props.onUpdateInput(e);
  };

  /**
   * Handles adding a chip.
   * @param {string|object} chip Value of the chip, either a string or an object (if dataSourceConfig is set)
   * @param {object=} options Additional options
   * @param {boolean=} options.clearInputOnFail If `true`, and `onBeforeAdd` returns `false`, clear the input
   * @returns True if the chip was added (or at least `onAdd` was called), false if adding the chip was prevented
   */
  handleAddChip(chip, options) {
    if (this.props.onBeforeAdd && !this.props.onBeforeAdd(chip)) {
      this._preventChipCreation = true;
      if (options != null && options.clearInputOnFail) {
        this.updateInput();
      }
      return false;
    }
    this.updateInput();
    const chips = this.props.value || this.state.chips;

    if (this.props.dataSourceConfig) {
      if (typeof chip === "string") {
        chip = {
          [this.props.dataSourceConfig.text]: chip,
          [this.props.dataSourceConfig.value]: chip,
        };
      }

      if (
        this.props.allowDuplicates ||
        !chips.some(
          (c) => c[this.props.dataSourceConfig.value] === chip[this.props.dataSourceConfig.value]
        )
      ) {
        if (this.props.value && this.props.onAdd) {
          this.props.onAdd(chip);
        } else {
          this.updateChips([...this.state.chips, chip]);
        }
      }
      return true;
    }

    if (chip.trim().length > 0) {
      if (this.props.allowDuplicates || chips.indexOf(chip) === -1) {
        if (this.props.value && this.props.onAdd) {
          this.props.onAdd(chip);
        } else {
          this.updateChips([...this.state.chips, chip]);
        }
      }
      return true;
    }
    return false;
  }

  handleDeleteChip(chip, i) {
    if (!this.props.value) {
      const chips = this.state.chips.slice();
      const changed = chips.splice(i, 1); // remove the chip at index i
      if (changed) {
        let focusedChip = this.state.focusedChip;
        if (this.state.focusedChip === i) focusedChip = null;
        else if (this.state.focusedChip > i) focusedChip = this.state.focusedChip - 1;

        this.updateChips(chips, { focusedChip });
      }
    } else this.props.onDelete && this.props.onDelete(chip, i);
  }

  updateChips(chips, additionalUpdates = {}) {
    this.setState({ chips, chipsUpdated: true, ...additionalUpdates });
    this.props.onChange && this.props.onChange(chips);
  }

  /**
   * Clears (if no value provided) or updates the text field for adding new chips.
   * This only works in uncontrolled input mode, i.e. if the inputValue prop is not used.
   * @public
   */
  updateInput(value) {
    this.setState({ inputValue: value === undefined ? "" : value });
  }

  /**
   * Set the reference to the actual input, that is the input of the Input.
   * @param {object} ref - The reference
   */
  setActualInputRef = (ref) => {
    this.actualInput = ref;
    if (this.props.inputRef) {
      this.props.inputRef(ref);
    }
  };

  defaultChipRenderer(
    { value, text, isFocused, isDisabled, isReadOnly, handleClick, handleDelete, className },
    key
  ) {
    return (
      <Chip
        key={key}
        className={className}
        style={{
          pointerEvents: isDisabled || isReadOnly ? "none" : undefined,
          backgroundColor: isFocused ? blue[300] : undefined,
          margin: "0px 3px 3px 0px",
        }}
        onClick={handleClick}
        onDelete={handleDelete}
        label={text}
      />
    );
  }
  render() {
    const {
      allowDuplicates,
      alwaysShowPlaceholder,
      blurBehavior,
      children,
      chipRenderer,
      classes,
      className,
      clearInputValueOnChange,
      dataSource,
      dataSourceConfig,
      defaultValue,
      delayBeforeAdd,
      disabled,
      disableUnderline,
      error,
      filter,
      FormHelperTextProps,
      fullWidth,
      fullWidthInput,
      helperText,
      id,
      InputProps = {},
      inputRef,
      InputLabelProps = {},
      inputValue,
      label,
      newChipKeyCodes,
      newChipKeys,
      onBeforeAdd,
      onAdd,
      onBlur,
      onDelete,
      onChange,
      onFocus,
      onKeyDown,
      onKeyPress,
      onKeyUp,
      onUpdateInput,
      placeholder,
      readOnly,
      required,
      rootRef,
      value,
      variant,
      prependIcon,
      ...other
    } = this.props;

    const chips = value || this.state.chips;
    const actualInputValue = inputValue != null ? inputValue : this.state.inputValue;

    const hasInput =
      (this.props.value || actualInputValue).length > 0 || actualInputValue.length > 0;
    const shrinkFloatingLabel =
      InputLabelProps.shrink != null
        ? InputLabelProps.shrink
        : label != null && (hasInput || this.state.isFocused || chips.length > 0);

    const chipComponents = chips.map((chip, i) => {
      const value = dataSourceConfig ? chip[dataSourceConfig.value] : chip;
      return (chipRenderer ? chipRenderer.bind(this)  : this.defaultChipRenderer)(
        {
          value,
          text: dataSourceConfig ? chip[dataSourceConfig.text] : chip,
          chip,
          isDisabled: !!disabled,
          isReadOnly: readOnly,
          isFocused: this.state.focusedChip === i,
          handleClick: () => this.setState({ focusedChip: i }),
          handleDelete: () => this.handleDeleteChip(chip, i),
          className: classes.chip,
        },
        i
      );
    });

    const InputMore = {};
    if (variant === "outlined") {
      InputMore.notched = shrinkFloatingLabel;
      InputMore.labelWidth =
        (shrinkFloatingLabel && this.labelNode && this.labelNode.offsetWidth) || 0;
    }

    if (variant !== "standard") {
      InputMore.startAdornment = <React.Fragment>{chipComponents}</React.Fragment>;
    } else InputProps.disableUnderline = true;

    const InputComponent = variantComponent[variant];

    return (
      <FormControl
        ref={rootRef}
        fullWidth={fullWidth}
        className={cx(className, classes.root, {
          [classes.marginDense]: other.margin === "dense",
        })}
        error={error}
        required={chips.length > 0 ? undefined : required}
        onClick={this.focus}
        disabled={disabled}
        variant={variant}
        {...other}
      >
        {label && (
          <InputLabel
            htmlFor={id}
            classes={{ root: cx(classes[variant], classes.label), shrink: classes.labelShrink }}
            shrink={shrinkFloatingLabel}
            focused={this.state.isFocused}
            variant={variant}
            ref={this.labelRef}
            required={required}
            {...InputLabelProps}
          >
            {label}
          </InputLabel>
        )}
        <div
          className={cx(classes[variant], classes.chipContainer, {
            [classes.focused]: this.state.isFocused,
            [classes.underline]: !disableUnderline && variant === "standard",
            [classes.disabled]: disabled,
            [classes.labeled]: label != null,
            [classes.error]: error,
          })}
        >
          {variant === "standard" && chipComponents}
          <InputComponent
            ref={this.input}
            classes={{
              input: cx(classes.input, classes[variant]),
              root: cx(classes.inputRoot, classes[variant]),
            }}
            id={id}
            value={actualInputValue}
            onChange={this.handleUpdateInput}
            onKeyDown={this.handleKeyDown}
            onKeyPress={this.handleKeyPress}
            onKeyUp={this.handleKeyUp}
            onFocus={this.handleInputFocus}
            onBlur={this.handleInputBlur}
            inputRef={this.setActualInputRef}
            disabled={disabled}
            fullWidth={fullWidthInput}
            placeholder={
              (!hasInput && (shrinkFloatingLabel || label == null)) || alwaysShowPlaceholder
                ? placeholder
                : null
            }
            readOnly={readOnly}
            {...InputProps}
            {...InputMore}
          />
        </div>
        {helperText && (
          <FormHelperText
            {...FormHelperTextProps}
            className={
              FormHelperTextProps
                ? cx(FormHelperTextProps.className, classes.helperText)
                : classes.helperText
            }
          >
            {helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  }
}

InputChips.defaultProps = {
  allowDuplicates: false,
  blurBehavior: "clear",
  clearInputValueOnChange: false,
  delayBeforeAdd: false,
  disableUnderline: false,
  newChipKeyCodes: [13],
  newChipKeys: ["Enter"],
  variant: "standard",
};
//export default InputChips;

export default withStyles(styles)(InputChips);
