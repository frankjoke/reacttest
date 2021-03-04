import React from "react";
import { Iob, t, connect } from "./Iob";
import {
  IButton,
  TButton,
  UButton,
  InputField,
  HtmlComponent,
} from "./UiComponents";
import ObjectBrowser from "./ObjectBrowser";
import {
  Paper,
  Container,
  Grid,
  Divider,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Collapse,
} from "@material-ui/core";
import {
  lightBlue,
  lightGreen,
  lightGrey,
  orange,
} from "@material-ui/core/colors";
import { isNoSubstitutionTemplateLiteral } from "typescript";
//import { config } from "chai";
//import { isNotEmittedStatement } from "typescript";
const AdapterEntry = (props) => {
  let { adapter, settings, adapterStates, instance, repo, index } = props;
  const [expanded, setExpanded] = React.useState(false);
  const [menue, setMenue] = React.useState(0);
  let {
    icon,
    localIcon,
    title,
    desc,
    readme,
    type,
    mode,
    version,
    controller,
    instances,
  } = settings;
  const radapter = repo[adapter];
  if (adapter == "js-controller" && controller) {
    icon =
      "https://raw.githubusercontent.com/ioBroker/ioBroker.admin/master/admin/admin.png";
    adapter = "ioBroker";
  }
  if (localIcon) icon = Iob.getStore.serverName.serverName + localIcon;
  const ainst = { instance };
  if (instance) {
    const { _id, common, native } = instance;
    ainst.loglevel = common.logLevel || "info";
    ainst.common = common;
    mode = common.mode;
    if (common && common.titleLang)
      title = Iob.getTranslatedDesc(common.titleLang);
    ainst.native = native;
    ainst.id = _id;
    ainst.iid = _id.slice("system.adapter.".length);
    function getS(name) {
      let state = adapterStates[_id + "." + name];
      //      console.log(_id + "." + name, state);
      if (state) ainst[name] = state.val;
      return state && state.val;
    }
    let astates = Object.keys(adapterStates)
      .filter((i) => i.startsWith(_id + "."))
      .map((i) => getS(i.split(".").slice(-1)[0]));
  }
  const { iid = adapter, alive = false, connected = false } = ainst;
  const iprops = {
    style: {
      margin: "0px 2px",
    },
    //     size: "small",
  };
  const rversion = (radapter && radapter.version) || version;
  const newVersion = rversion != version;
  function menuOptions(i, options = { className: "bottom-border-button" }) {
    const im = i == menue;
    return {
      size: "small",
      color: im ? "secondary" : "primary",
      onClick: (e) => (!im ? setMenue(i) : null),
      className: im ? "bottom-border-button" : "",
    };
  }
  function renderOptions() {
    return (
      <>
        <InputField
          label={"loglevel"}
          id={index + "-loglevel"}
          value={ainst.loglevel}
          inputProps={{ color: "secondary" }}
          options={"debug|info|warn|error|silly".split("|")}
          onChange={(e) =>
            console.log(
              `set log of ${iid} to `,
              e.target.value,
              ainst,
              instance
            ) ||
            Iob.connection.extendObject(ainst.id, {
              common: { loglevel: e.target.value },
            })
          }
        />
        {Iob.nbsp(3)}
        {ainst.common && (
          <InputField
            label="restart schedule"
            id={index + "-schedule"}
            value={ainst.common.restartSchedule}
          />
        )}
      </>
    );
  }

  function renderInstall() {
    if (controller)
      return (
        <>
          <TButton
            label="create Backup"
            icon="add_to_queue"
            tooltip={t("Create backup")}
          />
          <TButton
            label="change setup"
            icon="settings_input_component"
            tooltip={t("change setup for backend", iid)}
          />
          <TButton
            label="version"
            icon="add_to_drive"
            tooltip={t(
              "install specific version of js-controller {0}",
              adapter
            )}
          />
        </>
      );
    return (
      <>
        <TButton
          label="add"
          icon="add_to_queue"
          tooltip={t("add a new instance for {0}", adapter)}
        />
        <TButton
          label="delete"
          disabled={adapter == "admin" && instances && instances.length <= 1}
          icon="remove_from_queue"
          tooltip={t("remove instance {0} from adapters", iid)}
        />
        <TButton
          label="remove"
          disabled={adapter == "admin"}
          icon="remove_shopping_cart"
          tooltip={t("remove adapter {0} from ioBroker", adapter)}
        />
        <TButton
          label="version"
          icon="add_to_drive"
          tooltip={t("install specific version or from Git {0}", adapter)}
        />
      </>
    );
  }

  function renderHeader() {
    const l = Iob.getStore.location;

    return (
      <CardHeader
        style={{ backgroundColor: lightBlue[50], minHeight: 128 }}
        title={iid}
        titleTypographyProps={{ variant: "h6" }}
        subheaderTypographyProps={{ variant: "body2" }}
        subheader={
          <>
            {title ? (
              <>
                {title}
                <br />
              </>
            ) : null}
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {newVersion ? (
                <>
                  <IButton
                    color="secondary"
                    icon="update"
                    size="small"
                    tooltip={t("Update now to version {0}!", rversion)}
                  />
                  &nbsp;
                </>
              ) : null}
              {t("version: {0}", version)}
              {newVersion && <b>{t(", available: {0}", rversion)}</b>}
            </div>
            {alive && (
              <>
                Events&nbsp;↦{ainst.inputCount}&nbsp;/&nbsp;↦{ainst.outputCount}
                ,&nbsp;Mem&nbsp;
                {ainst.memRss}
              </>
            )}
          </>
        }
        avatar={<img src={icon} width="64px" heigth="64px" />}
        action={
          <IButton
            tooltip={t("configure adapter instance")}
            //                onClick={(e) => Iob.setLoglevel()}
            icon="settings"
            src={`${l.olocation.href}?hostname=${l.hostname}&port=${l.port}&adapterName=${adapter}`}
            {...iprops}
          />
          // <IButton
          //   icon="more_vert"
          //   tooltip="whatever other options you may add as a menu..."
          // />
        }
      ></CardHeader>
    );
  }
  //  console.log(adapter, ainst, iprops);
  return (
    <Grid item xs={12} sm={6} lg={4} xl={3}>
      <Card raised>
        {renderHeader()}
        <CardActions
          disableSpacing
          style={{
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: alive ? lightGreen[50] : lightBlue[50],
            padding: "1px",
          }}
        >
          <div>
            <TButton
              label="description"
              tooltip="set adapter start and log options"
              {...menuOptions(0)}
            />
            <TButton
              label="install"
              tooltip="install or update adapter"
              {...menuOptions(1)}
            />
            <TButton
              label="options"
              tooltip="displays adapter description"
              {...menuOptions(2)}
            />
            <TButton
              label="ressources"
              tooltip="show ressources"
              {...menuOptions(3)}
            />
          </div>
          <div>
            {!(controller || mode == "none") && (
              <>
                <IButton
                  tooltip={!alive ? t("start adapter") : t("stop adapter")}
                  onClick={(e) => Iob.enableDisableAdapter(!alive, iid)}
                  icon={!alive ? "play_circle" : "pause_circle"}
                  {...Iob.mergeProps(iprops, {
                    style: {
                      color: alive ? "red" : "secondary",
                    },
                  })}
                />
                <IButton
                  disabled={!alive}
                  tooltip={t("restart adapter")}
                  onClick={(e) => Iob.setLoglevel(null, iid)}
                  icon="replay_circle_filled"
                  {...Iob.mergeProps(iprops, {
                    style: {
                      color: !alive ? "red" : connected ? "green" : "orange",
                    },
                  })}
                />
              </>
            )}

            <IButton
              tooltip={t("open adapter help")}
              src={readme}
              //                onClick={(e) => Iob.setLoglevel()}
              icon="help_outline"
              {...iprops}
            />
          </div>
        </CardActions>
        <Divider />
        <CardContent style={{ minHeight: "80px", padding: "8px" }}>
          {menue == 2 ? renderOptions() : null}
          {menue == 1 ? renderInstall() : null}
          {menue == 0 ? (
            <Typography variant="body2">
              {Iob.getTranslatedDesc(desc)}
            </Typography>
          ) : null}
          {menue == 3 ? (
            <>
              ainst:
              <HtmlComponent
                component="pre"
                html={Iob.syntaxHighlight(Iob.stringify(ainst, 1, "\t"))}
              />
              <br />
              common:
              <HtmlComponent
                component="pre"
                html={Iob.syntaxHighlight(Iob.stringify(ainst.common, 2, "\t"))}
              />
              <br />
              native:
              <HtmlComponent
                component="pre"
                html={Iob.syntaxHighlight(Iob.stringify(ainst.native, 2, "\t"))}
              />
            </>
          ) : null}
        </CardContent>
        {/*         <Divider />
        <CardActions disableSpacing>
          <IButton
            icon={expanded ? "expand_less" : "expand_more"}
            tooltip={expanded ? "close expanded" : "open expanded"}
            onClick={(e) => setExpanded(!expanded)}
            style={{ marginLeft: "auto" }}
          />
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            
            {Iob.stringify(ainst, 1, null, 1)}
          </CardContent>
        </Collapse>
 */}
      </Card>
    </Grid>
  );
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
          if (adapter != "js-controller")
            Iob.connection
              .getAdapterInstances(adapter)
              .then((i) => (value.instances = i));
        this.setState({ installed: x });
      })
      .then((_) =>
        Iob.sendToHost(undefined, "getRepository", {
          repo: Iob.getStore.systemConfig.common.activeRepo,
        }).then((x) => this.setState({ repo: x }))
      )
      .catch((e) =>
        Iob.logSnackbar("error;could not load installed adapter list!")
      );
    //    const nconf = ConfigSettings.transformConfig(props.configPage);
  }

  render() {
    //    console.log(this.props.adapterLog);
    const { adapterStates, adapterStatus } = this.props;
    const { repo, installed, page } = this.state;
    const alist = [];
    const anames = {};
    Object.entries(installed).map(([adapter, settings], index) => {
      const { controller, instances = [null] } = settings;
      //              if (index>5) return null;
      instances.map((ai, ii) => {
        const { _id } = ai || {};
        let alive = _id && adapterStates[_id + ".alive"];
        //        console.log(_id, alive);
        alive = (alive && alive.val) || controller;
        const aname =
          /* (alive ? " " : ".") + */ (controller ? " " : ".") + adapter + ii;
        const nlist = {
          adapter,
          settings,
          id: _id,
          alive,
          instance: ai,
          key: `${index}-${ii}`,
          index: `AdapterList-${index}-${ii}`,
        };
        anames[aname] = nlist;
        alist.push(nlist);
      });
    });
    //    console.log(alist);
    return (
      <Container maxWidth={false} disableGutters style={{ overflow: "hidden" }}>
        <Grid
          container
          spacing={1}
          style={{ paddingTop: "4px", paddingBottom: "8px" }}
        >
          {Object.keys(anames)
            .sort()
            .map((a) => (
              <AdapterEntry
                {...anames[a]}
                adapterStates={adapterStates}
                repo={repo}
              />
            ))}
        </Grid>
        <ObjectBrowser label="Installed" value={installed} />
        <ObjectBrowser label="repo" value={repo} />
      </Container>
    );
  }
}

export default connect((state) => {
  const { adapterStatus, adapterStates, systemConfig } = state;
  return { adapterStatus, adapterStates, systemConfig };
})(AdapterList);
