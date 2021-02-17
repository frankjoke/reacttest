import React from "react";
//import { withStyles } from "@material-ui/core/styles";
//import "@babel/polyfill";
//import GenericApp from "./components/GenericApp";
import ConfigSettings from "./components/ConfigSettings";
//import { isThrowStatement } from "typescript";
//import {styles , AddTooltip, IButton, Tbutton, ScrollTop, LoadButton} from "./Components/UiComponents";
//import ConfigFixed from "../assets/config.json";
import { config } from "chai";
import Iob from "./components/Iob";
import { ThemeProvider } from "@material-ui/core/styles";
import { Loader } from "./components/UiComponents";
import "./components/loader.css";
import { DndProvider } from "react-dnd-multi-backend";
import HTML5toTouch from "react-dnd-multi-backend/dist/esm/HTML5toTouch";

const translations = {
  en: require("./i18n/en.json"),
  de: require("./i18n/de.json"),
  ru: require("./i18n/ru.json"),
  pt: require("./i18n/pt.json"),
  nl: require("./i18n/nl.json"),
  fr: require("./i18n/fr.json"),
  it: require("./i18n/it.json"),
  es: require("./i18n/es.json"),
  pl: require("./i18n/pl.json"),
  "zh-cn": require("./i18n/zh-cn.json"),
};

class App extends React.Component {
  constructor(props) {
    super(props);
    //    Iob.printPrompt();
    const options = { ...props, doNotLoadAllObjects: true };
    Iob.createConnection(options);
    Iob.mergeTranslations(translations);
    this.state = { displayLanguage: props.displayLanguage };
  }

  static getDerivedStateFromProps(props, state) {
    let newState = null;
    const { displayLanguage } = props;
    if (displayLanguage !== state.displayLanguage) newState = { ...newState, displayLanguage };
    //    console.log(newState);
    return newState;
  }

  render() {
    const theme = Iob.getTheme || {};
    return this.props.loaded ? (
      <div className="App">
        <ThemeProvider theme={theme}>
          <DndProvider options={HTML5toTouch}>
            <ConfigSettings lng={this.state.displayLanguage} />
          </DndProvider>
        </ThemeProvider>
      </div>
    ) : (
      <Loader theme={theme} />
    );
  }
}

export default Iob.connect((state) => {
  const { ...all } = state;
  return { ...all };
})(App);
