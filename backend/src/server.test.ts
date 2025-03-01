import { request } from 'graphql-request';

import { startServer } from './server';
import Simulation from './simulation';
import { createAndInsertTick, cleanup } from './testUtils';

const mockMarketConstructor = jest.fn();
const mockTickSetter = jest.fn();

jest.mock('./market/mock', () => ({
  default: class Market {
    constructor(...args) {
      mockMarketConstructor(...args);
    }

    addTickListener() {}
    setTicks(...args) {
      mockTickSetter(...args);
    }
  },
}));

describe('The server', () => {
  let getHost;
  let app;

  beforeAll(async () => {
    app = await startServer();

    await createAndInsertTick({
      last: 6001,
    });
    await createAndInsertTick({
      last: 5200,
    });

    const { port } = app.address();

    getHost = () => `http://127.0.0.1:${port}/api`;

    Simulation.prototype.run = jest.fn();

    const params = `mutation {
      runSimulation(startFiat: 2000, startValue: 0, strategy: "ema") {
        orders {
          date
          type
          quantity
          price
        }
      }
    }`;
    return request(getHost(), params);
  });

  afterEach(async () => {
    await app.close();
    await cleanup();
  });

  describe('when running a simulation', () => {
    it('creates a simulation class and feeds it the startValues', async () => {
      expect(Simulation.prototype.run).toHaveBeenCalled();
    });

    it('creates a market with the given fiat and value', () => {
      expect(mockMarketConstructor).toHaveBeenCalledWith({ accountFiat: 2000, accountValue: 0 });
    });

    it('should query ticks and feed them into the market', async () => {
      expect(mockTickSetter).toHaveBeenCalledTimes(1);

      const ticks = mockTickSetter.mock.calls[0][0];

      expect(ticks).toHaveLength(2);
      expect(ticks[0].last).toBe(6001);
      expect(ticks[1].last).toBe(5200);
    });
  });
});
