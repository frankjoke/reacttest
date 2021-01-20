// @ts-nocheck
//import { combineReducers } from 'redux';
import {
  createSlice,
  configureStore,
  createImmutableStateInvariantMiddleware,
} from "@reduxjs/toolkit";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
//import todosReducer from 'features/todos/todosSlice'
//import visibilityFilterReducer from 'features/filters/filtersSlice'

//let nextTodoId = 0;

const ioBroker = createSlice({
  name: "ioBrokerAdapter",
  initialState: {
    configPage: {},
    systemConfig: {},
    instanceConfig: {},
    ipAddresses: [
      { name: "[IPv4] 0.0.0.0 - Listen on all IPs", address: "0.0.0.0", family: "ipv4" },
    ],
    adapterName: "",
    inative: null,
    inativeChanged: false,
    inativeOld: "",
    adapterInstance: "iot.0",
    adapterLog: [],
    serverName: "http://localhost",
    displayLanguage: "en",
    adapterStates: {},
    adapterStatus: {},
    adapterObjects: {},
  },
  reducers: {
    setadapterObjects(state, action) {
      const mine = {};
      const objects = action.payload;
      for (const item of Object.keys(objects))
        if (item.startsWith(state.adapterInstance)) mine[item] = objects[item];
      state.adapterObjects = mine;
    },

    updateAdapterStates(state, action) {
      const states = Object.assign({}, state.adapterStates);
      for (const ust of action.payload) states[ust.id] = ust.state;
      state.adapterStates = states;
      const sai = "system.adapter." + state.adapterInstance;
      let alive = state.adapterStates[sai + ".alive"];
      alive = alive && alive.val;
      let connected = state.adapterStates[sai + ".connected"];
      connected = connected && connected.val;
      let connection = state.adapterStates[state.iobrokerAdapterInstance + ".info.connection"];
      connection = !connection || connection.val;
      const status = alive ? (connection ? 2 : 0) : 0;
      const r = {
        alive,
        connected,
        connection,
        status,
      };
      if (JSON.stringify(r) != JSON.stringify(state.adapterStatus)) state.adapterStatus = r;
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
      const native = JSON.parse(JSON.stringify(state.inative));

      function _updateNativeValue(obj, attrs, value) {
        if (typeof attrs !== "object") {
          attrs = attrs.split(".");
        }
        const attr = attrs.shift();
        if (attr === "$undefined") return false;
        if (!attrs.length) {
          //          console.log(`UpdateLast ${attr} ${obj[attr]} ${value}`);
          if (value !== undefined && value !==null && (typeof value === "object" || Array.isArray(value))) {
            if (JSON.stringify(obj[attr]) !== JSON.stringify(value)) {
              obj[attr] = value;
              return true;
            }
          } else if (obj[attr] != value) {
            obj[attr] = value;
            return true;
          } else {
            return false;
          }
        } else {
          obj[attr] = obj[attr] || {};
          if (typeof obj[attr] !== "object" && !Array.isArray(obj[attr])) {
            throw new Error("attribute " + attr + " is no object, but " + typeof obj[attr]);
          }
          return _updateNativeValue(obj[attr], attrs, value);
        }
      }

      const { attr, value } = action.payload;

      if (_updateNativeValue(native, attr, value)) {
        const changed = state.inativeOld != JSON.stringify(native);
//        console.log(`About to change ${attr} because of ${changed} to ${value}`)
        //        this.setState({ native, changed }, cb);
        state.inative = native;
        state.inativeChanged = changed;
      }
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
      state.serverName = action.payload;
    },
    setAdapterInstance(state, action) {
      state.adapterInstance = action.payload;
    },
    setaDisplayLanguage(state, action) {
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
      if (!iOld) iOld=iNew;
      state.inative = iOld;
      state.inativeOld = JSON.stringify(iNew);
      state.inativeChanged = JSON.stringify(state.inative) != state.inativeOld;
    },
    setSystemConfig(state, action) {
      state.systemConfig = action.payload;
    },
    setInstanceConfig(state, action) {
      state.instanceConfig = action.payload;
    },
    setIpAddresses(state, action) {
      state.ipAddresses = action.payload;
    },
    setAdapterName(state, action) {
      state.adapterName = action.payload;
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
        ],
      },
    }),
});
//console.log("store", store);
export { ioBroker, connect, bindActionCreators };

export default store;
