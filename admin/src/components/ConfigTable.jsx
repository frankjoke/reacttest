import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import {
  Iob,
  splitProps,
  defaultProps,
  t,
  isPartOf,
  logSnackbar,
} from "./Iob";
import {
  Icon,
  AppBar,
  Toolbar,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  TablePagination,
} from "@material-ui/core";
import ConfigItem from "./ConfigItem";
/* import { config } from "chai";
import { createSolutionBuilderWithWatch, isNoSubstitutionTemplateLiteral } from "typescript";
import { restore } from "sinon";
 */
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
class ConfigTable extends React.Component {
  constructor(props) {
    super(props);
    const { rest, split } = splitProps(props, "pageSize|height|width|rows|columns");
    const { rows, columns, ...psplit } = split;
    this.state = defaultProps(psplit, { heigth: 500, pageSize: 5, width: "100%", page: 0 });
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

  getKey(index) {
    return this.props.index + (index !== undefined ? `/${index}` : "");
  }

  render() {
    const { columns = [], rows = [] } = this.props;
    const { icon, label, ...rest } = this.props.item;
    const key = this.getKey();
    const drest = defaultProps(rest, { size: "small", key });
    const { width, height } = this.state;
    //    console.log("chips:", sel, items);
    const sw = (
      <div style={{ width, height }}>
        <AppBar position="static">
          <Toolbar variant="dense">
            {icon && <Icon>{icon}</Icon>}
            {label && (
              <Typography variant="h6" noWrap>
                &nbsp;{label}
              </Typography>
            )}
            <div style={{ flexGrow: 1 }} />
            <Iob.TButton
              icon="add"
              label={t("add item to %s", label)}
              color="inherit"
              onClick={this.addRow}
            ></Iob.TButton>
          </Toolbar>
        </AppBar>
        {this.renderTable(drest, columns, rows, key)}
      </div>
    );
    return sw;
  }

  renderTable(item, columns, rows = []) {
    const { height, ...prest } = item;
    const rest = defaultProps(prest, { rowsPerPage: 6 });
    const dstyle = { width: "100%" };
    if (height) dstyle.height = height;
    const { pageSize, page } = this.state;
    return (
      <Paper>
        <TableContainer style={dstyle}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                {columns.map((c, i) => (
                  <TableCell
                    component="th"
                    scope="row"
                    key={this.getKey("h" + i)}
                    align={c.align || "left"}
                  >
                    <Typography variant="subtitle1">{c.headerName}</Typography>
                  </TableCell>
                ))}
                <TableCell
                  key={this.getKey("h")}
                  component="th"
                  scope="row"
                  align="center"
                  width="1%"
                >
                  {"\u270D"}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(pageSize > 0 ? rows.slice(page * pageSize, page * pageSize + pageSize) : rows).map(
                (row, ri) => (
                  <TableRow key={this.getKey("h" + ri)} hover>
                    {columns.map((c, ci) => {
                      const rri = page * pageSize + ri;
                      const key = this.getKey(`r${rri}c${ci}`);
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
                          <ConfigItem
                            item={citem}
                            index={key}
                            table={rows}
                            app={this.props.app}
                            attr={`${this.props.attr}.${rri}.${c.field}`}
                            field={c.field}
                            native={row}
                            settings={this.props.settings}
                            value={row[c.field]}
                            settings={this.props.settings}
                            itype={c.itype}
                          />
                          {/* "" + row[c.field] */}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" padding="none">
                      <Iob.IButton
                        color="error"
                        tooltip={t("delete table row")}
                        icon="delete_forever"
                        onClick={(e) => this.deleteRow(ri)}
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[0, 5, 10, 25, 100]}
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
  handleChangePage = (event, newPage) => {
    this.setState({ page: newPage });
  };

  handleChangeRowsPerPage = (event) => {
    this.setState({ pageSize: +event.target.value });
    this.handleChangePage(event, 0);
  };

  deleteRow = (index) => {
    const { page, pageSize } = this.state;
    const { attr, rows = [] } = this.props;
    const item = index + page * pageSize;
    Iob.setStore.updateInativeValue({
      attr,
      value: rows.slice(0, item).concat(rows.slice(item + 1)),
    });
    const len = rows.length - 1;
    if (pageSize) {
      let npage = Math.floor(len / pageSize);
      if (len % pageSize == 0) npage--;
      if (page != npage) this.setState({ page: npage });
    }
  };

  addRow = () => {
    const newItem = {};
    const { attr, rows = [], columns } = this.props;
    const { page, pageSize } = this.state;
    columns.map((i) => {
      const def = i.defaultValue;
      const { field } = i;
      let value = def;
      if (!(def || def == "" || def == 0 || def == false))
        switch (i.itype) {
          case "string":
          case "text":
          case "html":
          case "password":
          case "textarea":
          case "select":
            value = "";
            break;
          case "chips":
          case "table":
            value = [];
            break;
          case "number":
            value = 0;
          case "switch":
          case "checkbox":
            value = false;
          default:
            break;
        }
      newItem[field] = value;
    });
    const nrows = rows.concat(newItem);
    const len = nrows.length;
    Iob.setStore.updateInativeValue({
      attr,
      value: nrows,
    });
    if (pageSize) {
      let npage = Math.floor(len / pageSize);
      if (len % pageSize == 0) npage--;
      if (page != npage) this.setState({ page: npage });
    }
  };
}

export default ConfigTable;
