import React, { Component } from 'react';
import {observer} from 'mobx-react';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import 'normalize.css/normalize.css';
import '@blueprintjs/core/dist/blueprint.css';
import '@blueprintjs/datetime/dist/blueprint-datetime.css';
import 'gridlex/docs/gridlex.css';
import './styles.css';
import MainStore from 'stores/MainStore';

import Header from './Header/Header';
import Holdings from './Holdings/Holdings';
import Prices from './Prices/Prices';

import { FocusStyleManager } from "@blueprintjs/core";
FocusStyleManager.onlyShowFocusOnTabs();

window.MainStore = MainStore;

class App extends Component {
  render() {
    return (
      <div className="App pt-monospace-text">
        <Header />
        <Holdings />
        <Prices />
      </div>
    );
  }
}

export default observer(App);
