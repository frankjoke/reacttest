import React from "react";
import "material-icons/iconfont/material-icons.css";
import ReactDOM from "react-dom";
import { MuiThemeProvider } from "@material-ui/core/styles";
import theme from "@iobroker/adapter-react/Theme";
import Utils from "@iobroker/adapter-react/Components/Utils";
import App from "./app";
import store from "./store/ioBroker";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";
import Iob from "./components/Iob";
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
        <Iob.MySnackbar />
        <Provider store={store}>
          <App
            socket={{ port: 8181 }}
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
