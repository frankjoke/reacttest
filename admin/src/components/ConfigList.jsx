import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
//import { Iob, t, connect } from "./Iob";
import { Iob, t } from "./Iob";
import ConfigItem from "./ConfigItem";
import { Paper, Container, Grid, Divider } from "@material-ui/core";
//import { config } from "chai";
//import { isNotEmittedStatement } from "typescript";

class ConfigList extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    this.state = {};
//    console.log(props);
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }

  render() {
    //    console.log(this.props.adapterLog);
    const { page, inative, index: ikey = "", attr = "", onUpdateValue } = this.props;

    return (
      <Container maxWidth={false} disableGutters style={{ overflow: "hidden" }}>
        <Paper elevation={2} style={{ padding: "4px 4px", margin: "3px 3px" }}>
          <Grid
            container
            spacing={page.spacing || 2}
            style={{ paddingTop: "4px", paddingBottom: "8px" }}
          >
            {page.items.map((item, index) => {
              const {
                cols,
                noGrid,
                hideItem,
                xs,
                xl,
                sm = cols ? cols : 2,
                md,
                lg,
                vdivider,
                ...items
              } = item;
              const split = { xs, xl, sm, md, lg };
              const rest = { ...split, ...items };
              const key = `${ikey}/${index}/${items.itype}`;
              if (typeof hideItem === "string")
                try {
                  const fun = Iob.makeFunction(hideItem, this, "props", "Iob");
                  item.hideItem = fun;
                  const res = fun(this.props, Iob);
                  //          console.log("hideItem", key, hideItem, res);
                  if (res) return null;
                } catch (e) {
                  Iob.logSnackbar("error; error in 'hideItem' for " + key + ":" + e);
                }
              else if (typeof hideItem === "boolean" && hideItem) return null;
              else if (typeof hideItem === "function" && hideItem(this.props, Iob)) return null;

              let configItem;
              if (rest.itype == "$divider")
                return (
                  <Grid item sm={12} key={key + "d"}>
                    <Divider variant="fullWidth" />
                  </Grid>
                );
              configItem = (
                <ConfigItem
                  key={key + "C"}
                  item={items}
                  index={key}
                  inative={inative}
                  attr={(attr ? attr + "." : "") + (item.field || "$undefined")}
                  field={item.field}
                  value={inative[item.field]}
                  settings={this}
                  onUpdateValue={onUpdateValue}
                  itype={items.itype}
                />
              );
              return [
                vdivider == "start" ? (
                  <Divider key={key + "v"} orientation="vertical" flexItem></Divider>
                ) : null,
                noGrid ? (
                  configItem
                ) : (
                  <Grid item {...split} key={key}>
                    {configItem}
                  </Grid>
                ),
                vdivider == "end" ? (
                  <Divider key={key + "v"} orientation="vertical" flexItem></Divider>
                ) : null,
              ];
            })}
          </Grid>
        </Paper>
      </Container>
    );
  }
}

export default ConfigList;
