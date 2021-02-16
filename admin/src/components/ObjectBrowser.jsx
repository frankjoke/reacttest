import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
import {
  styles,
  TButton,
  IButton,
  InputField,
  MakeDraggable,
  makeDraggable,
  AddTooltip2,
  IDialog,
} from "./UiComponents";
import { Iob, t, connect } from "./Iob";
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Icon,
  Button,
  TablePagination,
  TextField,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@material-ui/core";
import { TreeView, TreeItem } from "@material-ui/lab";
import EditState from "./EditState";
import { isIterationStatement } from "typescript";

import { useDrag } from "react-dnd"; //import { config } from "chai";
import { lightBlue } from "@material-ui/core/colors";
//import { isNotEmittedStatement } from "typescript";

class ObjectBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    let {
      pageSize = 25,
      heigth = 300,
      width = "100%",
      rowHeight = 32,
      dragZone,
      folded = false,
      expanded,
      rootName = "root",
      value,
    } = props;
    const ostate = {
      heigth,
      pageSize,
      width,
      rowHeight,
      value,
      folded,
      dragZone,
      rootName,
    };
    const nexp = expanded || [rootName];
    const filter = "";
    const nstate = {
      singlemode: true,
      page: 0,
      filter,
      expanded: nexp,
      ostate,
      ...ostate,
    };
    this.state = {
      ...nstate,
      ...ObjectBrowser._updateFilter(value, nstate ),
    };
    this.crow = null;
    console.log(this.state);
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }
/*
  static getDerivedStateFromProps(props, state) {
    let newState = null;
    const ostate = state.ostate;
    const nstate = {};
    let ncount = 0;
    for (const [key, val] of Object.entries(state.ostate))
      if (props[key] !== val) {
        ncount++;
        ostate[key] = nstate[key] = props[key];
      }
    if (ncount) newState = nstate;
    if (nstate.value !== undefined)
      newState = { ...nstate, ...this._updateFilter(props.value, state) };
    //    console.log(newState);
    return newState;
  }
*/
  static _updateFilter(value, state) {
    let { filteredLen, rowsFiltered, expanded, filter, rootName } = state;

    const list = [];

    function createList(name, value, idx = []) {
      const idn = idx.concat(name);
      const id = idn.join(".");
      const type = Iob.type(value);
      const level = idx.length;
      const item = { name, value, idn, id, level, ...type };
//      if (expanded.indexOf(id) >= 0) item.isexpanded = true;
      list.push(item);
      if (type.typeof === "array") {
        if (value.length) item.expandable = true;
        if (expanded.indexOf(id)>=0)
        value.map((v, i) => createList(`[${i}]`, v, idn));
      } else if (type.typeof === "object") {
        const obs = Object.entries(value);
        if (obs.length) item.expandable = true;
        if (expanded.indexOf(id)>=0)
        for (const [key, value] of obs) createList(key, value, idn);
      }
    }

    createList(rootName, value);
    const totalLen = list.length;
    filteredLen = list.length;
    rowsFiltered = list;
    /* 
    const states = Object.entries(props.adapterStates || {}).sort((a, b) =>
      a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
    );

    let { filteredLen, rowsFiltered, expanded, filter } = state;
    if (!states) return {};
    let totalLen = states.length;
    filter = filter && filter.toLowerCase();

    if (filter) rowsFiltered = states.filter((i) => Iob.customFilter(i, filter));
    else rowsFiltered = states;
    const titems = [];
    for (const [key] of rowsFiltered) {
      let akey = key.split(".");
      akey = [akey.slice(0, 2).join("."), ...akey.slice(2)];
      if (akey[0] === "system.adapter" && akey[2].match(/^\d+$/))
        akey = [akey[0], akey[1] + "." + akey[2], ...akey.slice(3)];
      const treew = titems;
      const treen = 1;
      for (const name of akey) {
        let found = treew.find((i) => i.item == name);
        if (!found) {
          const id = akey.slice(0, treen).join(".");
          const value = Iob.getState(id);
          //          if (value.common) console.log(value);
          found = {
            id,
            item: name,
            stateName: id != key ? "" : value && value.common ? value.common.name : "",
            items: [],
            level: treen - 1,
            name: Iob.trimL(name),
          };
          if (id == key && value) found.value = value;
          treew.push(found);
        }
        treew = found.items;
        ++treen;
      }
    }

    const rows = [];
    function renderItems(tree = [], level = 0) {
      if (!Array.isArray(tree)) return [];
      //      console.log(level, tree);
      for (const i of tree) {
        const { id, item, name, stateName, value, items } = i;
        const r = {
          id,
          name,
          value,
          stateName,
          level,
          expandable: !!(items && items.length),
          isexpanded: expanded && expanded.indexOf(id) >= 0,
        };
        rows.push(r);
        //        console.log(r);
        if (r.isexpanded && r.expandable) renderItems(items, level + 1);
      }
    }

    renderItems(titems);
    //    console.log(titems);
    filteredLen = rowsFiltered.length;
 */
    const rows = list.filter((i) => {
      for (const e of expanded) if (i.id === e || i.id == i.idn.slice(0, i.idn.length-1).join(".")) return true;
      return false;
    });
    console.log(totalLen, rows);
    return {
      filter,
      filteredLen,
      rowsFiltered,
      totalLen,
      rows,
    };
  }

  handleChangePage = (event, newPage) => {
    this.setState({ page: newPage });
  };

  handleChangeRowsPerPage = (event) => {
    this.setState({ pageSize: +event.target.value });
    this.handleChangePage(event, 0);
  };

  renderTree() {
    //    const { height, ...prest } = item;
    const dstyle = { width: "100%" };
    //    if (height) dstyle.height = height;
    const { pageSize, page, rows } = this.state;
    const columns = [
      { headerName: t("id"), width: "35%" },
      { headerName: "\u00A9", align: "center", width: "3%" },
      { headerName: t("name"), width: "25%" },
      { headerName: "\u270D", align: "center", width: "3%" },
      { headerName: t("Value"), align: "center", width: "30%" },
    ];
    //        console.log(tree, rows);
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
              ).map((row, ri) => this.renderRow(row, ri))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[0, 10, 25, 40, 60, 100]}
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

  renderRow(row, ri) {
    const { expandable, isexpanded, id, level, name, stateName } = row;
    const { expanded, page, pageSize, singlemode, dragZone } = this.state;
    const rin = page * pageSize + ri;
    const cellProps = {
      component: "td",
      scope: "row",
      padding: "none",
      size: "small",
      style: { padding: "0px 0px" },
    };

    function toggleExpand(that) {
      let nexpand;
      if (isexpanded)
        nexpand = expanded
          .slice(0, expanded.indexOf(id))
          .concat(expanded.slice(expanded.indexOf(id) + 1));
      else {
        nexpand = Array.from(expanded);
        for (let i = 0; i < nexpand.length; )
          if (id.startsWith(nexpand[i])) i++;
          else if (singlemode) nexpand.splice(i, 1);
          else i++;
        nexpand.push(id);
      }
      that.setState({
        expanded: nexpand,
      });
    }
    let longName = row.stateName || "";
    while (row.stateName && longName.length < 40) longName += "\u00A0\u00A0";
    const key = this.props.index + "h" + rin;
    return (
      <TableRow key={key} hover style={isexpanded ? { backgroundColor: lightBlue[50] } : {}}>
        <TableCell
          {...cellProps}
          style={expandable ? { cursor: "pointer" } : { cursor: "default" }}
        >
          <div
            style={{
              paddingLeft: 24 * level + (expandable ? 0 : 12),
              display: "flex",
              whiteSpace: "nowrap",
            }}
            onClick={(e) => toggleExpand(this)}
          >
            {!expandable ? (
              <span>&nbsp;&nbsp;</span>
            ) : isexpanded ? (
              <IButton size="small" icon="expand_more" />
            ) : (
              <IButton size="small" icon="chevron_right" />
            )}
            <Typography
              variant="subtitle2"
              title={`${row.id}\n${row.stateName}\n${Object.keys(row.value || {})}`}
            >
              <strong>{row.name}</strong>{" "}
            </Typography>
          </div>
        </TableCell>
        <TableCell {...cellProps} align="center">
          <IButton
            icon="content_copy"
            size="small"
            tooltip={t("copy id to clipboard.")}
            onClick={(e) => {
              Iob.copyToClipboard(id);
              Iob.logSnackbar("info;copied '{0}' to clipboard!", id);
            }}
            style={{ marginLeft: 8, marginRight: 8 }}
          />
        </TableCell>
        <TableCell {...cellProps}>
          <MakeDraggable
            dragDisable={!row.stateName}
            dragValue={{ value: row.stateName, dropped: row, index: rin, component: this }}
            dragZone={dragZone}
            dragProps={{ style: { opacity: 0.5, cursor: "move" } }}
          >
            <Typography style={{ cursor: "pointer" }} variant="caption">
              {longName}
            </Typography>
          </MakeDraggable>
        </TableCell>
        <TableCell {...cellProps} align="center">
          {row.stateName && (
            <IButton
              icon="drive_file_rename_outline"
              size="small"
              tooltip={t("rename State")}
              onClick={(e) => {
                this.crow = row;
                Iob.getDialog({
                  type: "activeOk",
                  inputValue: row.stateName,
                  text: t("Rename state text from id '{0}'", row.id),
                }).then((r) =>
                  typeof r === "string"
                    ? Iob.connection.extendObject(row.id, { common: { name: r } })
                    : null
                );
                //                Iob.logSnackbar("warning;rename not implemented '{0}'", row);
              }}
              style={{ marginLeft: 8, marginRight: 8 }}
            />
          )}
        </TableCell>
        <TableCell {...cellProps} align="center">
          {id}
        </TableCell>
      </TableRow>
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
      singlemode,
      idrename,
    } = this.state;
    console.log(this.state);
    //    console.log("chips:", sel, items);
    const sw = (
      <div style={{ width, height, display: "flex", flexFlow: 1 }}>
        <AppBar position="static">
          <Toolbar variant="dense">
            <Icon>view_list</Icon>
            <Typography variant="subtitle2" noWrap>
              &nbsp;{t("Object")}&nbsp;&nbsp;
            </Typography>
            <TButton
              label={t("single")}
              tooltip={t("switch between single open tree or allow multiple open trees")}
              icon={singlemode ? "radio_button_checked" : "radio_button_unchecked"}
              onClick={(e) => this.setState({ singlemode: !singlemode })}
              color="inherit"
            />
            <div style={{ flexGrow: 1 }} />
            <Icon style={{ paddingRight: "30px" }}>filter_alt</Icon>
            <InputField
              value={filter}
              placeholder={t("Filter states")}
              onChange={(e) => this.setState({ filter: e.target.value })}
              endAdornment={
                filter ? (
                  <IButton
                    size="small"
                    icon="close"
                    onClick={(e) => this.setState({ filter: "" })}
                  />
                ) : null
              }
              onKeyDown={(e) => (e.keyCode == 27 ? this.setState({ filter: "" }) : null)}
            />
            <Typography variant="subtitle2" noWrap>
              &nbsp;{totalLen == filteredLen ? t("all") : filteredLen}&nbsp;{t("of")}&nbsp;
              {totalLen ? totalLen : t("none")}
            </Typography>
            <div style={{ flexGrow: 1 }} />
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
        <IDialog
          type="activeOk"
          options={{
            okOnEnter: true,
            title: t("Rename state name"),
            cancelIcon: "close",
            cancelColor: "primary",
            cancelLabel: t("cancel"),
            okIcon: "done",
            okLabel: t("ok"),
            okColor: "secondary",
            okTooltip: t("click here to accept data"),
            inputProps: {
              rules: [
                //                  check on invalid characters
                (v) =>
                  !v.match(/[\[\].*,;'"`<>\\?]+/) ||
                  t("Name should not include chractesrs like '{0}'!", "[]*.,;'\"`<>\\?"),
                (v) => {
                  //                  console.log("rule OctiveOk", v);
                  const cname = this.crow && this.crow.stateName;
                  return (
                    !Object.keys(this.props.adapterObjects)
                      .map((i) => this.props.adapterObjects[i].common.name)
                      .find((i) => i == v && v != cname) || t("Name should not exist in adapter!")
                  );
                },
              ],
              label: t("Name to change"),
              hint: t("Please enter name, it must not be used already in your adapter!"),
            },
          }}
        >
          <br />
          <TButton
            label={t("Id also")}
            tooltip={t("switch on to rename also state id or name only")}
            icon={idrename ? "radio_button_checked" : "radio_button_unchecked"}
            onClick={(e) => this.setState({ idrename: !idrename })}
            color="secondary"
          />
          <br />
        </IDialog>
        {!folded && this.renderTree()}
      </React.Fragment>
    );
  }
}

export default ObjectBrowser;
