import React from "react";
//import { withStyles, makeStyles } from "@material-ui/core/styles";
import { IButton, TButton, IDialog } from "./UiComponents";
import { Iob, t } from "./Iob";
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
class ConfigTable extends React.Component {
  constructor(props) {
    super(props);
    const {
      pageSize = 5,
      heigth = 500,
      width = "100%",
      rows,
      columns,
      folded = false,
      ...rest
    } = props;
    this.state = { heigth, pageSize, width, page: 0, folded };
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
    const {
      icon,
      label,
      size = "small",
      key = this.getKey(),
      ...rest
    } = this.props.item;
    const drest = { size, key, ...rest };
    const { width, height, folded } = this.state;
    //    console.log("chips:", sel, items);
    const sw = (
      <div style={{ width, height }}>
        <AppBar position="static">
          <Toolbar variant="dense" disableGutters>
            {icon && <Icon>{icon}</Icon>}
            {label && (
              <Typography variant="h6" noWrap>
                &nbsp;{label}
              </Typography>
            )}
            <div style={{ flexGrow: 1 }} />
            <TButton
              icon="add"
              label={t("add new entry to {0}", label)}
              color="inherit"
              tooltip={t("add new line item to {0}", label)}
              disabled={folded}
              onClick={this.addRow}
            ></TButton>
            <TButton
              icon={folded ? "keyboard_arrow_down" : "keyboard_arrow_left"}
              tooltip={t("fold/unfold data")}
              color="inherit"
              onClick={(e) => this.setState({ folded: !folded })}
            ></TButton>
          </Toolbar>
        </AppBar>
        {!folded && this.renderTable(drest, columns, rows, key)}
      </div>
    );
    return sw;
  }

  renderTable(item, columns, rows = []) {
    const { height, rowsPerPage = 6, ...prest } = item;
    const rest = { ...prest, rowsPerPage };
    const dstyle = { width: "100%" };
    if (height) dstyle.height = height;
    const { pageSize, page } = this.state;
    return (
      <Paper variant="outlined">
        <TableContainer style={dstyle}>
          <Table aria-label={this.props.label + " table"}>
            <TableHead style={{ backgroundColor: "gainsboro" }}>
              <TableRow size="small">
                {columns.map((c, i) => (
                  <TableCell
                    size="small"
                    component="th"
                    scope="row"
                    key={this.getKey("h" + i)}
                    align={c.align || "left"}
                    variant="head"
                    size="small"
                    style={{ padding: "0px 4px" }}
                  >
                    <Typography variant="subtitle1">
                      <strong>{c.headerName}</strong>
                    </Typography>
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
              {(pageSize > 0
                ? rows.slice(page * pageSize, page * pageSize + pageSize)
                : rows
              ).map((row, ri) => (
                <TableRow key={this.getKey("h" + ri)} hover>
                  {columns.map((c, ci) => {
                    const rri = page * pageSize + ri;
                    const key = this.getKey(`r${rri}c${ci}`);
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
                    const citem = { ...icitem, size, margin };
                    return (
                      <TableCell
                        key={key}
                        component="td"
                        scope="row"
                        size="small"
                        align={c.align || "left"}
                        style={{ padding: "0px 2px" }}
                      >
                        <ConfigItem
                          item={citem}
                          index={key}
                          table={rows}
                          attr={`${this.props.attr}.${rri}.${
                            c.field || "$undefined"
                          }`}
                          field={c.field}
                          inative={row}
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
                    <IButton
                      color="error"
                      tooltip={t("delete table row")}
                      icon="delete_forever"
                      onClick={(e) => {
                        console.log(e, row);
                        Iob.getDialog({
                          type: "deleteTableEntry",
                          text: t("Delete row with item '{0}'", row.name),
                        }).then((r) => (r ? this.deleteRow(ri) : null));
                        //                Iob.logSnackbar("warning;rename not implemented '{0}'", row);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
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
        <IDialog
          type="deleteTableEntry"
          options={{
            title: t("delete table row"),
            cancelIcon: "close",
            cancelColor: "primary",
            cancelLabel: t("dcancel"),
            okIcon: "done",
            okLabel: t("ok"),
            okColor: "secondary",
            okTooltip: t("click here to accept to delete"),
          }}
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
    const { attr, rows = [], onUpdateValue } = this.props;
    const item = index + page * pageSize;
    onUpdateValue(attr, rows.slice(0, item).concat(rows.slice(item + 1)));
    const len = rows.length - 1;
    if (pageSize) {
      let npage = Math.floor(len / pageSize);
      if (len % pageSize == 0) npage--;
      if (page != npage) this.setState({ page: npage });
    }
  };

  addRow = () => {
    const newItem = {};
    const { attr, rows = [], columns, onUpdateValue } = this.props;
    const { page, pageSize } = this.state;
    columns.map((i) => {
      const def = i.defaultValue;
      const { field } = i;
      let value = def;
      if (!(def || def == "" || def == 0 || def == false))
        switch (i.itype) {
          case "$string":
          case "$text":
          case "$html":
          case "$password":
          case "$textarea":
          case "$select":
            value = "";
            break;
          case "$chips":
          case "$table":
            value = [];
            break;
          case "$number":
            value = 0;
          case "$switch":
          case "$checkbox":
            value = false;
          default:
            break;
        }
      newItem[field] = value;
    });
    const nrows = rows.concat(newItem);
    const len = nrows.length;
    onUpdateValue(attr, nrows);
    if (pageSize) {
      let npage = Math.floor(len / pageSize);
      if (len % pageSize == 0) npage--;
      if (page != npage) this.setState({ page: npage });
    }
  };
}

export default ConfigTable;
