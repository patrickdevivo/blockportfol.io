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
import Performance from './Performance/Performance';
import Prices from './Prices/Prices';

import ManageTransactions from './ManageTransactions/ManageTransactions';

import { FocusStyleManager, Alert, Callout } from "@blueprintjs/core";
FocusStyleManager.onlyShowFocusOnTabs();

window.MainStore = MainStore;

class App extends Component {
  render() {
    return (
      <div className="App pt-monospace-text">
        <ManageTransactions />
        <Header />
        <Callout className="pt-intent-primary" style={{textAlign: 'center'}}>
          <h5>This is beta software.</h5>
        </Callout>
        <Holdings />
        <Performance />
        <Prices />
        <Alert
          isOpen={window.location.protocol === 'https'}
        />
        <Callout style={{padding: '20px 40px'}}>
          <h5>Coming Soon:</h5>
          <p>Charts, pricing tables, import from exchanges, export to csv and date range selections</p>
        </Callout>
      </div>
    );
  }
}

export default observer(App);
