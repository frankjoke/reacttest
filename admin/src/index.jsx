import React from "react";
import "material-icons/iconfont/material-icons.css";
import ReactDOM from "react-dom";
import { MuiThemeProvider } from "@material-ui/core/styles";
import App from "./app";
import store from "./store/ioBroker";
import { SnackbarProvider, useSnackbar } from "notistack";
import Iob from "./components/Iob";
import { Icon, IconButton } from '@material-ui/core';
import { Provider } from "react-redux";
import "material-icons/iconfont/material-icons.css";
import "../style.css";
import conf from "../assets/config.js";

store.$snackbarProvider = {
  enqueueSnackbar: (message, opts) =>
    console.log("enqueueSnackbar not defined yet!", message, opts),

  closeSnackbar: (message, opts) => console.log("closeSnackbar not defined yet!", message, opts),
};

function MySnackbar() {
  store.$snackbarProvider = useSnackbar();
  return null;
}

//import Iob from "./components/Iob";
//import 'overlayscrollbars/css/OverlayScrollbars.css';
function build() {
  ReactDOM.render(
    <SnackbarProvider
      maxSnack={6}
      dense
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      autoHideDuration={6000}
      action={(key) => (
        <IconButton color="inherit" onClick={() => Iob.closeSnackbar(key)}>
          <Icon>close</Icon>
        </IconButton>
      )}
    >
      <MySnackbar />
      <Provider store={store}>
        <MuiThemeProvider theme={Iob.getTheme}>
          <App
            socket={{ port: window.location.port == 1234 ? 8181 : window.location.port }}
            onThemeChange={(_theme) => {
              Iob.createTheme(_theme || Iob.getStore.themeName);
              //              build();
            }}
          />
        </MuiThemeProvider>
      </Provider>
    </SnackbarProvider>,
    document.getElementById("root")
  );
}

build();
