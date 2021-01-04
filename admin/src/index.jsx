import React from "react";
import ReactDOM from "react-dom";
import { MuiThemeProvider } from "@material-ui/core/styles";
import theme from "@iobroker/adapter-react/Theme";
import Utils from "@iobroker/adapter-react/Components/Utils";
import App from "./app";
import store from "./rtk/reducers";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";

let themeName = Utils.getThemeName();

function build() {
  ReactDOM.render(
    <MuiThemeProvider theme={theme(themeName)}>
      <Provider store={store}>
        <SnackbarProvider
          maxSnack={4}
          dense
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        >
          <App
            socket={{ port: 8181 }}
            onThemeChange={(_theme) => {
              themeName = _theme;
              build();
            }}
          />
        </SnackbarProvider>
      </Provider>
    </MuiThemeProvider>,
    document.getElementById("root")
  );
}

build();
