// @ts-nocheck
//import { combineReducers } from 'redux';
import { createSlice, configureStore } from "@reduxjs/toolkit";
//import todosReducer from 'features/todos/todosSlice'
//import visibilityFilterReducer from 'features/filters/filtersSlice'

let nextTodoId = 0;

const ioBroker = createSlice({
  name: "ioBrokerAdapter",
  initialState: {
    configPage: {},
    systemConfig: {},
    instanceConfig: {},
    ipAddresses: [
      { name: "[IPv4] 0.0.0.0 - Listen on all IPs", address: "0.0.0.0", family: "ipv4" },
    ],
    adapterName: "broadlink2",
    inative: {},
    inativeChanged: false,
    inativeOld: "",
    adapterInstance: "iot.0",
    adapterLog: [],
    serverName: "http://localhost",
    displayLanguage: "en",
    adapterStates: {},
    adapterStatus: {},
  },
  reducers: {
    updateAdapterStates(state, action) {
      for (const ust of action.payload) state.adapterStates[ust.id] = ust.state;
      const sai = "system.adapter." + state.adapterInstance
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
    updateInativeValue(state, action) {
      const native = JSON.parse(JSON.stringify(state.inative));

      function _updateNativeValue(obj, attrs, value) {
        if (typeof attrs !== "object") {
          attrs = attrs.split(".");
        }
        const attr = attrs.shift();
        if (!attrs.length) {
          //          console.log(`UpdateLast ${attr} ${obj[attr]} ${value}`);
          if (value && (typeof value === "object" || Array.isArray(value))) {
            if (JSON.stringify(obj[attr]) !== JSON.stringify(value)) {
              obj[attr] = value;
              return true;
            }
          } else if (obj[attr] !== value) {
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
      //      console.log(`About to change ${attr} to ${value}`)
      if (_updateNativeValue(native, attr, value)) {
        const changed = state.inativeOld != JSON.stringify(native);
        //        this.setState({ native, changed }, cb);
        state.inative = native;
        state.inativeChanged = changed;
      }
    },

    updateAdapterLog(state, action) {
      function timeStamp(ts) {
        function digits(v, p) {
          p = p || 2;
          v = v.toString();
          while (v.length < p) v = "0" + v;
          return v;
        }
        const d = new Date(ts);
        return `${digits(d.getHours())}:${digits(d.getMinutes())}:${digits(
          d.getSeconds()
        )}.${digits(d.getMilliseconds(), 3)}`;
      }
      let payload = action.payload;
      if (!Array.isArray(payload)) payload = [action.payload];
      payload.map((p) => {
        const message = Object.assign({}, p);
        const { from, ts, _id, ...rest } = message;
        rest.tss = timeStamp(ts);
        rest.id = _id;
        console.log(rest);
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
      state.inative = action.payload;
      state.inativeOld = JSON.stringify(action.payload);
      state.inativeChanged = false;
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
});
console.log("store", store);
export { ioBroker };

export default store;
