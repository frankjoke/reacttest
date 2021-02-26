// @ts-nocheck
//import { combineReducers } from 'redux';
import { common } from "@material-ui/core/colors";
import {
  createSlice,
  configureStore,
  //  createImmutableStateInvariantMiddleware,
} from "@reduxjs/toolkit";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
//import todosReducer from 'features/todos/todosSlice'
//import visibilityFilterReducer from 'features/filters/filtersSlice'

//let nextTodoId = 0;
myLocation = window.myLocation || window.location;
//console.log(myLocation);
const query = (myLocation.search || "").replace(/^\?/, "").replace(/#.*$/, "");
const args = {};
query
  .trim()
  .split("&")
  .filter((t) => t.trim())
  .forEach((b) => {
    const parts = b.split("=");
    args[parts[0]] = parts.length === 2 ? parts[1] : true;
  });

// extract instance from URL
const instance =
  args.instance !== undefined
    ? parseInt(args.instance, 10) || 0
    : parseInt(myLocation.search.slice(1), 10) || 0;
// extract adapter name from URL
const tmp = (myLocation.pathname || myLocation.olocation.pathname).split("/");
const {
  host,
  port,
  adapterName = window.adapterName || tmp[tmp.length - 2] || "iot",
} = myLocation;
const instanceId = "system.adapter." + adapterName + "." + instance;

//console.log(port, host, instance, adapterName);
const ioBroker = createSlice({
  name: "ioBrokerAdapter",
  initialState: {
    configPage: {},
    systemConfig: {},
    location: Object.assign({}, myLocation),
    common: {},
    instanceConfig: {},
    ipAddresses: [
      {
        name: "[IPv4] 0.0.0.0 - Listen on all IPs",
        address: "0.0.0.0",
        family: "ipv4",
      },
    ],
    adapterName,
    instance,
    instanceId,
    inative: null,
    inativeChanged: false,
    inativeOld: "",
    adapterInstance: adapterName + "." + instance,
    adapterLog: [],
    serverName: myLocation.protocol + "//" + myLocation.host,
    displayLanguage: window.sysLang || "en",
    adapterStates: {},
    adapterStatus: {},
    adapterObjects: {},
    stateNames: {},
    translations: {},
    width: "xs",
    narrowWidth: false,
    theme: {},
    themeName: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "colored",
    themeType: "",
    loaded: false,
    connected: false,
  },
  reducers: {
    setThemeName(state, action) {
      const themeName = action.payload;
      state.themeName = themeName;
      state.themeType =
        themeName === "dark" || themeName === "blue" ? "dark" : "light";
    },

    setLoaded(state, action) {
      state.loaded = action.payload;
    },

    setConnected(state, action) {
      state.connected = action.payload;
    },

    setTheme(state, action) {
      state.theme = action.payload;
    },

    setAdapterObjects(state, action) {
      const mine = {};
      const objects = action.payload;
      for (const item of Object.keys(objects))
        if (item.startsWith(state.adapterInstance)) mine[item] = objects[item];
      state.adapterObjects = mine;
    },

    updateAdapterStates(state, action) {
      const states = Object.assign({}, state.adapterStates);
      const adapterObjects = Object.assign({}, state.adapterObjects);
      const { adapterInstance } = state;
      for (const { id, state } of action.payload) {
        if (!state) delete states[id];
        else {
          state._id = id;
          if (id.startsWith(adapterInstance + ".") && state) {
            const ido = Object.assign({}, adapterObjects[id]);
            if (ido && ido.common) {
              const common = Object.assign({}, ido.common);
              //              console.log(id, state, common);
              if (common.name) {
                state._common = common;
                state._name = common.name;
              }
            }
          } else state._name = id.split(".").slice(2).join(".");
          states[id] = state;
        }
      }
      state.adapterStates = states;
      const stateNames = {};
      for (const [key, value] of Object.entries(states))
        if (value._name) {
          const name = value._name;
          const sname = stateNames[name];
          if (sname) {
            if (Array.isArray(sname)) sname.push(key);
            else stateNames[name] = [sname, key];
          } else stateNames[name] = key;
        }
      state.stateNames = stateNames;
      const sai = "system.adapter." + adapterInstance;
      let alive = state.adapterStates[sai + ".alive"];
      alive = alive && alive.val;
      let connected = state.adapterStates[sai + ".connected"];
      connected = connected && connected.val;
      let connection =
        state.adapterStates[state.iobrokerAdapterInstance + ".info.connection"];
      connection = !connection || connection.val;
      const status = alive ? (connection ? 2 : 0) : 0;
      const r = {
        alive,
        connected,
        connection,
        status,
      };
      if (JSON.stringify(r) != JSON.stringify(state.adapterStatus))
        state.adapterStatus = r;
    },

    updateAdapterObjects(state, action) {
      const objects = Object.assign({}, state.adapterObjects);
      for (const ust of action.payload) {
        if (ust.newObj) objects[ust.id] = ust.newObj;
        else delete objects[ust.id];
      }
      state.adapterObjects = objects;
    },

    updateInativeValue(state, action) {
      const changed = state.inativeOld != JSON.stringify(action.payload);
      //        console.log(`About to change ${attr} because of ${changed} to ${value}`)
      //        this.setState({ native, changed }, cb);
      state.inative = action.payload;
      state.inativeChanged = changed;
    },

    updateAdapterLog(state, action) {
      let payload = action.payload;
      if (!Array.isArray(payload)) payload = [action.payload];
      payload.map((p) => {
        const message = Object.assign({}, p);
        const { from, ts, _id, ...rest } = message;
        rest.id = _id;
        //        console.log(rest);
        if (from == state.adapterInstance) {
          if (state.adapterLog.length >= 256) state.adapterLog.pop();
          state.adapterLog.unshift(rest);
        }
      });
    },
    clearAdapterLog(state, action) {
      const start = action.payload;
      state.adapterLog = start > 0 ? state.adapterLog.slice(0, start) : [];
    },
    setInativeChanged(state, action) {
      state.inativeChanged = !!action.payload;
    },
    setServerName(state, action) {
      //      console.log("setServerName:", action.payload);
      state.serverName = action.payload;
    },
    setAdapterInstance(state, action) {
      state.adapterInstance = action.payload;
    },
    setDisplayLanguage(state, action) {
      state.displayLanguage = action.payload;
    },
    setInativeOld(state, action) {
      state.inativeOld = JSON.stringify(action.payload);
    },
    setConfigPage(state, action) {
      state.configPage = action.payload;
    },
    setInative(state, action) {
      let { iNew, iOld } = action.payload;
      if (!iNew) iNew = action.payload;
      if (!iOld) iOld = iNew;
      state.inative = iOld;
      state.inativeOld = JSON.stringify(iNew);
      state.inativeChanged = JSON.stringify(state.inative) != state.inativeOld;
    },
    setSystemConfig(state, action) {
      state.systemConfig = action.payload;
      if (action.payload.common) state.common = action.payload.common;
    },
    setInstanceConfig(state, action) {
      state.instanceConfig = action.payload;
    },
    setIpAddresses(state, action) {
      state.ipAddresses = action.payload;
    },
    setTranslations(state, action) {
      state.translations = action.payload;
    },
    setWidth(state, action) {
      const width = action.payload;
      state.width = width;
      state.narrowWidth = width == "xs" || width == "sm" || width == "md";
    },
    setAdapterName(state, action) {
      const name = action.payload;
      state.adapterName = name;
      state.adapterInstance = name + "." + state.instance;
      state.instanceId = "system.adapter." + state.adapterInstance;
    },
  },
});

const store = configureStore({
  reducer: ioBroker.reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: {
        ignoredPaths: [
          "adapterLog",
          "adapterObjects",
          "adapterStatus",
          "inative",
          "configPage",
          "systemConfig",
          "instanceConfig",
          "translations",
        ],
      },
    }),
});
//console.log("store", store, ioBroker);
export { ioBroker, connect, bindActionCreators };

export default store;
