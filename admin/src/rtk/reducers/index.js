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
    ipAddresses: [],
    adapterName: "broadlink2",
    inative: {},
    inativeChanged: false,
    inativeOld: "",
  },
  reducers: {
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

      const {attr, value} = action.payload;
//      console.log(`About to change ${attr} to ${value}`)
      if (_updateNativeValue(native, attr, value)) {
        const changed = state.inativeOld != JSON.stringify(native);
        //        this.setState({ native, changed }, cb);
        state.inative = native;
        state.inativeChanged = changed;
      }
    },
    setInativeChanged(state, action) {
      state.inativeChanged = !!action.payload;
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
