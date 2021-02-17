import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
//import GenericApp from "@iobroker/adapter-react/GenericApp";
//import InputChips from "./InputChips";
//import ChipInput from "material-ui-chip-input";
//import { Iob, t, connect } from "./Iob";
import { Iob, t, connect } from "./Iob";
import ConfigItem from "./ConfigItem";
import ObjectBrowser from "./ObjectBrowser";
import {
  Paper,
  Container,
  Grid,
  Divider,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
} from "@material-ui/core";
//import { config } from "chai";
//import { isNotEmittedStatement } from "typescript";

const AdapterEntry = ({ adapter, settings }) => {
  return <Grid xs={3} sm={3} lg={2} xl={2}><Card>{adapter}, {Iob.stringify(settings, 1)}</Card></Grid>;
};

class AdapterList extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    this.state = { installed: {}, repo: {}, page: props.page };
    //    console.log("AdapterList", props);
    Iob.sendToHost(undefined, "getInstalled", {})
      .then((x) => {
        for (const [adapter, value] of Object.entries(x))
          if (adapter!="js-controller") Iob.connection.getAdapterInstances(adapter).then(i => value.instances = i)
        this.setState({ installed: x })
      })
      .then((_) =>
        Iob.sendToHost(undefined, "getRepository", {
          repo: Iob.getStore.systemConfig.common.activeRepo,
        }).then((x) => this.setState({ repo: x }))
      )
      .catch((e) => Iob.logSnackbar("error;could not load installed adapter list!"));
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }

  render() {
    //    console.log(this.props.adapterLog);
    const { adapterStates } = this.props;
    const { repo, installed, page } = this.state;
    //    console.log(repo, installed);
    return (
      <Container maxWidth={false} disableGutters style={{ overflow: "hidden" }}>
        <Paper elevation={2} style={{ padding: "4px 4px", margin: "3px 3px" }}>
          <Grid container spacing={2} style={{ paddingTop: "4px", paddingBottom: "8px" }}>
            {Object.entries(installed).map(([adapter, settings], index) => (
              <AdapterEntry key={index} adapter={adapter} settings={settings} />
            ))}
          </Grid>
          <ObjectBrowser label="Installed" value={installed} />
          <ObjectBrowser label="repo" value={repo} />
        </Paper>
      </Container>
    );
  }
}

export default connect((state) => {
  const { adapterStates, systemConfig } = state;
  return { adapterStates, systemConfig };
})(AdapterList);
