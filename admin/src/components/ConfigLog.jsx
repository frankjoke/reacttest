import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
import ConfigItem from "./ConfigItem";
import Filter from "@material-ui/icons/Filter";

//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
import { Iob, styles, t, splitProps, defaultProps, isPartOf, connect } from "./Iob";
import {
  Avatar,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Icon,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TablePagination,
  InputBase,
} from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import { config } from "chai";
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
    const { items, split } = splitProps(props.item, "pageSize|height|width|rowHeight|itype");
    this.state = defaultProps(split, {
      heigth: 200,
      pageSize: 25,
      width: "100%",
      rowHeight: 32,
      items,
      adapterLog: props.adapterLog,
      page: 0,
      columns: [
        { headerName: t("Time"), field: "tss", headerName: "Time", width: 140 },
        { headerName: t("Severity"), field: "severity", headerName: "Severity", width: 60 },
        { headerName: t("Message"), field: "message", headerName: "Message", width: 900 },
      ],
      ...ConfigLog._updateFilter("", props),
    });
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }

  static getDerivedStateFromProps(props, state) {
    let newState = null;
    const { adapterLog, filter } = state;
    //    console.log("derivedState:", state.opvalue, props.value, state.value);
    if (props.adapterLog != adapterLog) {
      //      console.log("Prop value changed!", state.opvalue, props.value, state.value);
      newState = { adapterLog: props.adapterLog, ...ConfigLog._updateFilter(filter, props, state) };
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
        (i) =>
          (i.message && i.message.toLowerCase().indexOf(filter) >= 0) ||
          (i.severity && i.severity.toLowerCase().indexOf(filter) >= 0)
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

  updateFilter(filter) {
    this.setState(ConfigLog._updateFilter(filter, this.props, this.state));
  }
  renderTable(item, columns, rows = []) {
    //    const { height, ...prest } = item;
    //    const rest = defaultProps(prest, { rowsPerPage: 6 });
    const dstyle = { width: "100%" };
    //    if (height) dstyle.height = height;
    const { pageSize, page } = this.state;
    return (
      <Paper>
        <TableContainer style={dstyle}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                {columns.map((c, i) => (
                  <TableCell component="th" scope="row" key={"h" + i} align={c.align || "left"}>
                    <Typography variant="subtitle2">{c.headerName}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(pageSize > 0 ? rows.slice(page * pageSize, page * pageSize + pageSize) : rows).map(
                (row, ri) => (
                  <TableRow key={"h" + ri} hover>
                    {columns.map((c, ci) => {
                      const rri = page * pageSize + ri;
                      const key = `r${rri}c${ci}`;
                      const { headerName, sortable, align, defaultValue, ...icitem } = c;
                      delete icitem.class;
                      const citem = defaultProps(icitem, { size: "small", margin: "none" });
                      return (
                        <TableCell
                          key={key}
                          component="td"
                          scope="row"
                          padding="none"
                          size="small"
                          align={c.align || "left"}
                        >
                          <Typography variant="body2">{row[c.field]}</Typography>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                )
              )}
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
    } = this.state;
    //    console.log("chips:", sel, items);
    const sw = (
      <div style={{ width, height, display: "flex", flexFlow: 1 }}>
        <AppBar position="static" >
          <Toolbar variant="dense">
            <Icon>speaker_notes</Icon>
            <Typography variant="subtitle2" noWrap>
              &nbsp;{t("Log from %s", this.props.adapterInstance)}
            </Typography>
            <div style={{ flexGrow: 1 }} />
            <Icon style={{paddingRight:"30px"}}>filter_alt</Icon>
            <InputBase
              value={filter}
              placeholder={t("Filter log report")}
              onChange={(e) => this.updateFilter(e.target.value)}
            />
            <Typography variant="subtitle2" noWrap>
              &nbsp;{totalLen == filteredLen ? t("all") : filteredLen}&nbsp;{t("of")}&nbsp;
              {totalLen ? totalLen : t("none")}
            </Typography>
            <div style={{ flexGrow: 1 }} />
            <Iob.TButton
              icon="delete_sweep"
              label={t("Clear log")}
              tooltip={t("Clear adapter log and leave only last entry")}
              color="inherit"
              onClick={(e) => Iob.setStore.clearAdapterLog(1)}
            ></Iob.TButton>
          </Toolbar>
        </AppBar>
      </div>
    );
    return (
      <>
        {sw},{this.renderTable(items, columns, rowsFiltered)}
      </>
    );
  }
}

export default connect((state) => {
  const { adapterLog, adapterInstance } = state;
  return { adapterLog, adapterInstance };
})(ConfigLog);
