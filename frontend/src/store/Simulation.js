import { observable } from 'mobx';
import BaseModel from './Base';

export default class Simulation extends BaseModel {
  @observable from;
  @observable to;
  @observable orders;
  @observable trades;

  @observable _loading = false;

  async fetch() {
    this._loading = true;
    const response = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation {
          runSimulation(
            startValue: 7000
            startFiat: 7000
          ) {
            orders {
              date
              type
              quantity
              price
            }
            trades {
              buyPrice
              buyDate
              sellPrice
              sellDate
              result
            }
          }
      }`,
      }),
    });

    const res = await response.json();
    this.parse(res.data.runSimulation);
    this._loading = false;
  }
}
