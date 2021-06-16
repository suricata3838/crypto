import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { observer } from 'mobx-react';
import styled from 'styled-components';

import Header from '../component/Header';
import SimulationForm from './SimulationForm';
import CoinValue from './CoinValue';
import SimulationResult from './SimulationResult';
import Trades from './Trades';
import Simulation from '../store/Simulation';

import applePay from '../store/applePay';
console.log('applePay:', applePay.length);

const Main = styled.main`
  display: grid;
  padding: 1rem 1rem;

  background: linear-gradient(#1f2640, #070a17);
  color: white;
  height: 100vh;
  width: 100vw;

  grid-template-rows: repeat(16, 1fr);
  grid-template-columns: repeat(8, 1fr);
  grid-row-gap: 1rem;
  grid-column-gap: 2rem;
`;

@observer
class Home extends Component {
  componentWillMount() {
    this.simulation = new Simulation();
  }

  render() {
    return (
      <Main>
        <Header>Seira Crypto</Header>
        <SimulationForm simulation={this.simulation} />
        <SimulationResult simulation={this.simulation} />
        <Trades simulation={this.simulation} />
        <CoinValue simulation={this.simulation} />
      </Main>
    );
  }
}

class App extends Component {
  render() {
    return (
      <React.StrictMode>
        <Router>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route
              exact
              path="/.well-known/apple-developer-merchantid-domain-association"
              render={() => <div>{applePay}</div>}
            />
          </Switch>
        </Router>
      </React.StrictMode>
    );
  }
}

export default App;
