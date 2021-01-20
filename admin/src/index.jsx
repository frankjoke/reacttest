import React from "react";
import "material-icons/iconfont/material-icons.css";
import ReactDOM from "react-dom";
import { MuiThemeProvider } from "@material-ui/core/styles";
import theme from "@iobroker/adapter-react/Theme";
import Utils from "@iobroker/adapter-react/Components/Utils";
import App from "./app";
import store from "./store/ioBroker";
import { SnackbarProvider , useSnackbar} from "notistack";

store.$snackbarProvider = {
  enqueueSnackbar: (message, opts) =>
    console.log("enqueueSnackbar not defined yet!", message, opts),

  closeSnackbar: (message, opts) => console.log("closeSnackbar not defined yet!", message, opts),
};


function MySnackbar() {
  store.$snackbarProvider = useSnackbar();
  return null;
}


import { Provider } from "react-redux";
//import Iob from "./components/Iob";
//import 'overlayscrollbars/css/OverlayScrollbars.css';
let themeName = Utils.getThemeName();


function build() {
  ReactDOM.render(
    <MuiThemeProvider theme={theme(themeName)}>
      <SnackbarProvider
        maxSnack={6}
        dense
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        <MySnackbar />
        <Provider store={store}>
          <App
            socket={{ port: window.location.port == 1234 ? 8181 : window.location.port  }}
            onThemeChange={(_theme) => {
              themeName = _theme || themeName;
              build();
            }}
          />
        </Provider>
      </SnackbarProvider>
    </MuiThemeProvider>,
    document.getElementById("root")
  );
}

build();
