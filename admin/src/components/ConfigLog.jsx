import React from "react";
//import { withStyles, makeStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
import {
  styles,
  TButton,
  AutocompleteSelect,
  AddTooltipChildren,
  InputField,
  FilterField,
} from "./UiComponents";
import { Iob, t, connect } from "./Iob";
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Icon,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TablePagination,
  TextField,
  InputBase,
  Select,
  MenuItem,
} from "@material-ui/core";
import ConfigList from "./ConfigList";
import { lightBlue } from "@material-ui/core/colors";
//import { config } from "chai";
//import { isNotEmittedStatement } from "typescript";

/**
 * @typedef {object} SettingsProps
 * @property {Record<string, string>} classes
 * @property {Record<string, any>} inative
 * @property {(field: string, value: any) => void} onChange
 */

/**
 * @typedef {object} SettingsState
 * @property {undefined} [dummy] Delete this and add your own state properties here
 */

/**
 * @extends {React.Component<SettingsProps, SettingsState>}
 */
class ConfigLog extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    const {
      pageSize = 25,
      heigth = 200,
      width = "100%",
      rowHeight = 32,
      itype,
      folded = false,
      ...items
    } = props.item;
    this.state = {
      heigth,
      pageSize,
      width,
      rowHeight,
      items,
      adapterLog: props.adapterLog,
      page: 0,
      columns: [
        {
          headerName: t("Time"),
          field: "tss",
          headerName: "Time",
          width: "10%",
        },
        {
          headerName: t("Severity"),
          field: "severity",
          headerName: "Severity",
          width: "7%",
          align: "center",
        },
        {
          headerName: t("Message"),
          field: "message",
          headerName: "Message",
          width: "83%",
        },
      ],
      ...ConfigLog._updateFilter("", props),
    };
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }

  static getDerivedStateFromProps(props, state) {
    let newState = null;
    const { adapterLog, filter, ofilter } = state;
    //    console.log("derivedState:", state.opvalue, props.value, state.value);
    if (props.adapterLog != adapterLog || filter != ofilter) {
      //      console.log("Prop value changed!", state.opvalue, props.value, state.value);
      newState = {
        ofilter: filter,
        adapterLog: props.adapterLog,
        ...ConfigLog._updateFilter(filter, props, state),
      };
    }
    return newState;
  }
  static _updateFilter(filter, props, state = {}) {
    let { filteredLen, rowsFiltered } = state;
    let { adapterLog } = props;
    let totalLen = adapterLog.length;

    filter = filter && filter.toLowerCase();

    if (filter)
      rowsFiltered = adapterLog.filter(
        (i) => Iob.customFilter(i, filter)
        /*           (i.message && i.message.toLowerCase().indexOf(filter) >= 0) ||
          (i.severity && i.severity.toLowerCase().indexOf(filter) >= 0)
 */
      );
    else rowsFiltered = adapterLog;

    filteredLen = rowsFiltered.length;
    return { filter, filteredLen, rowsFiltered, totalLen };
  }

  handleChangePage = (event, newPage) => {
    this.setState({ page: newPage });
  };

  handleChangeRowsPerPage = (event) => {
    this.setState({ pageSize: +event.target.value });
    this.handleChangePage(event, 0);
  };

  renderTable(item, columns, rows = []) {
    //    const { height, ...prest } = item;
    const dstyle = { width: "100%" };
    //    if (height) dstyle.height = height;
    const { pageSize, page } = this.state;
    return (
      <Paper>
        <TableContainer style={dstyle}>
          <Table aria-label="adapter log">
            <TableHead style={{ backgroundColor: "gainsboro" }}>
              <TableRow size="small" padding="none">
                {columns.map((c, i) => (
                  <TableCell
                    component="th"
                    scope="row"
                    key={"h" + i}
                    align={c.align || "left"}
                    variant="head"
                    size="small"
                    width={c.width}
                    style={{ padding: "0px 4px" }}
                  >
                    <Typography variant="subtitle1">
                      <strong>{c.headerName}</strong>
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(pageSize > 0
                ? rows.slice(page * pageSize, page * pageSize + pageSize)
                : rows
              ).map((row, ri) => {
                let color = "";
                switch (row.severity) {
                  case "error":
                    color = "#f8bbd0";
                    break;
                  case "info":
                    if (row.message.indexOf("debug:") < 0)
                      color = lightBlue[50];
                    else color = "#fafafa";
                    break;
                  case "warn":
                    color = "#ffe0b2";
                    break;
                  case "debug":
                    color = "#fafafa";
                    break;
                  default:
                    color = "#ffffff";
                    break;
                }
                return (
                  <TableRow
                    key={"h" + ri}
                    hover
                    style={{ backgroundColor: color }}
                  >
                    {columns.map((c, ci) => {
                      const rri = page * pageSize + ri;
                      const key = `r${rri}c${ci}`;
                      const {
                        headerName,
                        sortable,
                        align,
                        defaultValue,
                        size = "small",
                        margin = "none",
                        ...icitem
                      } = c;
                      delete icitem.class;
                      const citem = { size, margin, ...icitem };

                      return (
                        <TableCell
                          key={key}
                          component="td"
                          scope="row"
                          padding="none"
                          size="small"
                          align={c.align || "left"}
                          style={{ padding: "0px 8px" }}
                        >
                          <Typography variant="body2">
                            {row[c.field]}
                          </Typography>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[0, 10, 25, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={pageSize}
          page={page}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
        />
      </Paper>
    );
  }

  render() {
    //    console.log(this.props.adapterLog);
    const {
      width,
      height,
      pageSize,
      rowHeight,
      items,
      filter,
      rowsFiltered,
      totalLen,
      filteredLen,
      columns,
      folded,
    } = this.state;
    const { instanceConfig, adapterStatus, adapterInstance } = this.props;
    //    console.log("chips:", sel, items);
    const sw = (
      <div style={{ width, height, display: "flex", flexFlow: 1 }}>
        <AppBar position="static">
          <Toolbar variant="dense" disableGutters>
            <Icon>speaker_notes</Icon>
            <Typography variant="subtitle2" noWrap>
              &nbsp;{t("{0} log", adapterInstance)}
            </Typography>
            <div style={{ flexGrow: 1 }} />
            <AddTooltipChildren
              tooltip={t("set the debug level within running adapter only!")}
            >
              <Typography variant="subtitle2" noWrap>
                &nbsp;{t("level")}&nbsp;
              </Typography>
            </AddTooltipChildren>
            <InputField
              style={{ minWidth: 60 }}
              //              color="secondary"
              size="small"
              margin="dense"
              options={"debug|info|warn|error|silly".split("|")}
              disabled={!adapterStatus.alive || folded}
              disableClearable
              value={
                Iob.getStateValue(".logLevel") || instanceConfig.common.loglevel
              }
              onChange={(e) => Iob.setStateValue(".logLevel", e.target.value)}
            />
            <div style={{ flexGrow: 1 }} />
            <FilterField
              filter={filter}
              style={{ maxWidth: 100 }}
              onChange={(v) => this.setState({ filter: v })}
              disabled={folded || !adapterStatus.alive}
            />
            <Typography variant="subtitle2" noWrap>
              &nbsp;{totalLen == filteredLen ? t("all") : filteredLen}&nbsp;
              {t("of")}&nbsp;
              {totalLen ? totalLen : t("none")}
            </Typography>
            <div style={{ flexGrow: 1 }} />
            <TButton
              icon="delete_sweep"
              label={t("Clear log")}
              tooltip={t("Clear adapter log and leave only last entry")}
              disabled={folded}
              color="inherit"
              onClick={(e) => Iob.setStore.clearAdapterLog(1)}
            ></TButton>
            <TButton
              icon={folded ? "keyboard_arrow_down" : "keyboard_arrow_left"}
              tooltip={t("fold/unfold data")}
              color="inherit"
              onClick={(e) => this.setState({ folded: !folded })}
            ></TButton>
          </Toolbar>
        </AppBar>
      </div>
    );
    return (
      <React.Fragment>
        {sw}
        {!folded && this.renderTable(items, columns, rowsFiltered)}
      </React.Fragment>
    );
  }
}

export default connect((state) => {
  const {
    adapterLog,
    adapterInstance,
    adapterStatus,
    instanceConfig,
    adapterStates,
  } = state;
  return {
    adapterLog,
    adapterInstance,
    adapterStatus,
    instanceConfig,
    adapterStates,
  };
})(ConfigLog);
