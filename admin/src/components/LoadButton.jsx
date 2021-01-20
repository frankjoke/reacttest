import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Dropzone from "react-dropzone";
import { Iob, splitProps, defaultProps, t } from "./Iob";
import { Icon, Button } from "@material-ui/core";

class LoadButton extends React.Component {
  constructor(props) {
    super(props);
    const { items, split } = splitProps(props, "receivedFile|tooltip|dropLabel|dropStyle");
    this.state = defaultProps(split, {
      items,
      isOver: "",
      receivedFile: split.receivedFile || ((f) => f),
      dropLabel: "drop here",
      dropStyle: {color: "black"}
    });
//    this.id = props.label + props.icon + props.endIcon;
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
  loadTextFromFile(files) {
    this.setState({ isOver: false });
    if (!files.length) return;
    const file = files[0];
//    console.log("onDrop Files:", files, file);
    const reader = new FileReader();
    reader.onload = (e) => {
      let r = e.target.result;
      this.state.receivedFile(r, file.path);
    };
    reader.readAsText(file);
  }

  render() {
    const { isOver, items, dropLabel, dropStyle } = this.state;
    const { label, narrow, icon, startIcon, endIcon, ...props } = Object.assign({}, items);
//    if (isOver) props.color = "secondary";
    //    console.log(props);
    const iFontSize = props.size == "small" || props.size == "large" ? props.size : "default";
    if (startIcon)
      props.startIcon =
        typeof startIcon === "string" ? <Icon fontSize={iFontSize}>{startIcon}</Icon> : startIcon;
    else if (icon)
      props.startIcon = typeof icon === "string" ? <Icon fontSize={iFontSize}>{icon}</Icon> : icon;
    else if (endIcon)
      props.endIcon =
        typeof endIcon === "string" ? <Icon fontSize={iFontSize}>{endIcon}</Icon> : endIcon;
    if (isOver) props.title = isOver;
    const dz = (
      <span>
        <Dropzone
          onDrop={(acceptedFiles) => this.loadTextFromFile(acceptedFiles)}
          onDragEnter={() => this.setState({ isOver: dropLabel })}
          onDragLeave={() => this.setState({ isOver: "" })}
          multiple={false}
        >
          {({ getRootProps, getInputProps }) => (
            <React.Fragment>
              <Button {...props} {...getRootProps({ refKey: "innerRef" })} style={isOver ? dropStyle : {}}>
                {!narrow && !isOver ? label : isOver}
              </Button>
              <input type="file" style="display: none" {...getInputProps()} />
            </React.Fragment>
          )}
        </Dropzone>
      </span>
    );
    const sw = Iob.AddTooltip(this.state.tooltip, dz);
    return sw;
  }
}

export { LoadButton };
