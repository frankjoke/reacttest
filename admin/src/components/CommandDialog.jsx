import React from "react";

import PropTypes from "prop-types";

import { withStyles } from "@material-ui/core/styles";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  // @ts-ignore
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from "@material-ui/core";

//import CloseIcon from "@material-ui/icons/Close";

import { Iob, t } from "./Iob.js";
import { TButton, RButton } from "./UiComponents";
import { amber, blue, red } from "@material-ui/core/colors";

const styles = (
  /** @type {{ spacing: (arg0: number) => any; palette: { grey: any[]; }; }} */ theme
) => ({
  closeButton: {
    position: "absolute",
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  log: {
    height: 400,
    width: 860,
    padding: theme.spacing(1),
    overflowY: "auto",
  },
  error: {
    color: red[500],
  },
  info: {
    color: blue[500],
  },
  warn: {
    color: amber[500],
  },
});

class CommandDialog extends React.Component {
  /**
   * @param {{ cmd: any }} props
   */
  constructor(props) {
    super(props);
    const { classes, type = "commandDialog", cmd, open, ...rprops } = props;
    this.classes = classes;
    this.state = {
      cmd,
      log: ["$ iobroker " + (cmd || "")],
      init: false,
      max: null,
      value: null,
      progressText: "",
      ...rprops,
      open: false,
      closeOnExit: false,
    };
    Iob.setDialog(type, (setToShow) => {
      let nstate = { open: !!setToShow };
      if (setToShow && typeof setToShow === "object") {
        const { callback, ...rest } = setToShow;
        this.callback = typeof callback === "function" ? callback : null;
        nstate = { ...nstate, ...rest };
        nstate.log = nstate.cmd ? [`$ iobroker '${nstate.cmd}'`] : [];
      }
      //      this.how = false;
      this.setState(nstate);
    });
  }

  componentDidMount() {
    if (/* this.props.ready && */ this.state.cmd) {
      this.executeCommand();
    }
  }

  componentDidUpdate() {
    if (!this.state.init && /* this.props.ready && */ this.state.cmd) {
      this.executeCommand();
    }
  }

  executeCommand() {
    Iob.connection.registerCmdStdoutHandler(this.cmdStdoutHandler.bind(this));
    Iob.connection.registerCmdStderrHandler(this.cmdStderrHandler.bind(this));
    Iob.connection.registerCmdExitHandler(this.cmdExitHandler.bind(this));

    const activeCmdId = Math.floor(Math.random() * 0xffffffe) + 1;

    this.setState({
      activeCmdId,
      init: true,
    });
    const { currentHost, cmd } = this.state;
    //    console.log("cmdExec", currentHost, cmd);
    try {
      return Iob.connection
        .cmdExec(currentHost, cmd, activeCmdId)
        .catch(
          (e) =>
            e != "timeout"
              ? console.log("cmdExec Err", e)
              : null /*  Iob.enqueueSnackbar("error;cmdExec error catch {0}", e) */
        )
        .then((_) => this.setState({ init: false, cmd: "" }));
    } catch (error) {
      Iob.enqueueSnackbar("error;cmdExec error {0}", error);
    }
  }

  /**
   * @param {any} id
   * @param {string} text
   */
  cmdStdoutHandler(id, text) {
    if (this.state.activeCmdId && this.state.activeCmdId === id) {
      text = text
        .replace(/ {5,80}/g, " => ")
        .replace(/  /g, "\n")
        .split("\n");

      console.log(text);
      const log = this.state.log.concat(text); //      log.push(text);

      //   const upload = text.match(/^upload \[(\d+)]/);
      //   const gotAdmin = !upload
      //     ? text.match(/^got [-_:/\\.\w\d]+\/admin$/)
      //     : null;
      //   const gotWww = !gotAdmin ? text.match(/^got [-_:/\\.\w\d]+\/www$/) : null;

      //   /** @type {number | null} */
      //   let max = this.state.max;
      //   let value = null;
      //   let progressText = "";

      //   if (upload) {
      //     max = max || parseInt(upload[1], 10);
      //     value = parseInt(upload[1], 10);
      //   } else if (gotAdmin) {
      //     // upload of admin
      //     progressText = t("Upload admin started");
      //     max = null;
      //   } else if (gotWww) {
      //     // upload of www
      //     progressText = t("Upload www started");
      //     max = null;
      //   }

      this.setState({
        log,
        //        max,
        //        value,
        //        progressText,
      });

      // console.log("cmdStdout");
    }
  }

  /**
   * @param {any} id
   * @param {string} text
   */
  cmdStderrHandler(id, text) {
    if (this.state.activeCmdId && this.state.activeCmdId === id) {
      text = text
        .replace(/ {5,80}/g, " => ")
        .replace(/  /g, "\n")
        .split("\n");

      console.log(text);
      const log = this.state.log.concat(text);

      this.setState({
        log,
      });

      //   console.log("cmdStderr");
      //   console.log(id);
      //   console.log(text);
    }
  }

  /**
   * @param {any} id
   * @param {string | number} exitCode
   */
  cmdExitHandler(id, exitCode) {
    if (this.state.activeCmdId && this.state.activeCmdId === id) {
      const log = this.state.log.slice();
      log.push(
        (exitCode !== 0 ? "ERROR: " : "") +
          "Process exited with code " +
          exitCode
      );
      const nstate = {
        log,
        init: false,
        cmd: "",
      };
      if (this.state.closeOnExit) nstate.open = false;
      this.setState(nstate);

      //   console.log("cmdExit");
      //   console.log(id);
      //   console.log(exitCode);
    }
  }

  /**
   * @param {string} text
   */
  colorize(text) {
    const pattern = ["error", "warn", "info"];
    const regExp = new RegExp(pattern.join("|"), "i");

    if (text.search(regExp) >= 0) {
      const result = [];
      const { classes } = this.props;

      while (text.search(regExp) >= 0) {
        // @ts-ignore
        const [match] = text.match(regExp);
        const pos = text.search(regExp);

        if (pos > 0) {
          const part = text.substring(0, pos);

          result.push(part);
          text = text.replace(part, "");
        }

        const part = text.substr(0, match.length);

        result.push(
          <span className={classes[match.toLowerCase()]}>{part}</span>
        );
        text = text.replace(part, "");
      }

      if (text.length > 0) {
        result.push(text);
      }

      return result;
    }

    return text;
  }

  getLog() {
    return this.state.log.map((value, index) => {
      return (
        <Typography key={index} component="p" variant="body2">
          {this.colorize(value)}
          <br />
        </Typography>
      );
    });
  }

  handleClose(e) {
    const onClose = this.state.onClose;
    this.how = false;
    onClose && onClose(e);
    console.log("onClose", e);
    this.setState({ cmd: "", open: false });
  }

  handleConfirm(e) {
    const onConfirm = this.state.onConfirm;
    this.how = true;
    onConfirm && onConfirm(e);
    console.log("onConfirm", e);
    this.setState({ cmd: "", open: false });
  }

  render() {
    const {
      open,
      onConfirm = (/** @type {Event} */ e) => console.log("onConfirm", e),
      confirmText = "OK",
      max,
      value,
      progressText = "Run Command",
      init,
      closeOnExit,
    } = this.state;
    return (
      <Dialog
        onClose={(e) => this.handleClose(e)}
        open={open}
        maxWidth="lg"
        onExit={(...e) => this.callback && this.callback(this.how)}
      >
        <DialogTitle>
          {progressText}
          <TButton
            onClick={(e) => this.handleClose(e)}
            icon="close"
            tooltip="Close this Dialog!"
          />
          {/* <IconButton
            className={this.classes.closeButton}
            onClick={this.props.onClose}
          >
            <CloseIcon />
          </IconButton> */}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              {init ? (
                <LinearProgress
                  variant={max ? "determinate" : "indeterminate"}
                  value={
                    max && value
                      ? 100 - Math.round(((value || 0) / (max || 100)) * 100)
                      : 0
                  }
                />
              ) : null}
            </Grid>
            <Grid item>
              <Paper className={this.classes.log}>{this.getLog()}</Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <RButton
            label="close on exit"
            checked={closeOnExit}
            onChange={(e) =>
              console.log("RButton onChange", e) ||
              this.setState({ closeOnExit: e })
            }
          />
          <div style={{ flexGrow: 1 }} />
          <Button
            disabled={init}
            autoFocus
            onClick={(e) => this.handleConfirm(e)}
            color="primary"
          >
            {confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

// CommandDialog.propTypes = {
//   confirmText: PropTypes.string,
//   header: PropTypes.string,
//   onClose: PropTypes.func.isRequired,
//   onConfirm: PropTypes.func.isRequired,
//   open: PropTypes.bool.isRequired,
// };

// @ts-ignore
export default withStyles(styles)(CommandDialog);
