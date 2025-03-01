import MockMarket from './mock';

import Tick from '../models/tick';
import { delay, createTicks } from '../testUtils';
import Order, { OrderType, OrderSide } from './order';


describe('The MockMarket', () => {
  let ticks: Tick[];
  beforeAll(async () => {
    ticks = createTicks([{
      last: 6001,
    }, { last: 5200 }, { last: 5300 }, { last: 6200 }, { last: 6100 }
    ])
  });

  it('executes a buy order when it encounters a lower tick', async () => {
    let buyOrder: Order = null;

    const market = new MockMarket({ accountValue: 0, accountFiat: 7000 });
    market.setTicks(ticks);

    market.buy(6000, 1).then((order) => {
      buyOrder = order;
    });

    expect(buyOrder).toBeNull();

    let tick = await market.tick();

    expect(tick.last).toBeGreaterThan(6000);
    expect(buyOrder).toBeNull();

    tick = await market.tick();

    expect(tick.last).toBeLessThanOrEqual(6000);
    expect(buyOrder).not.toBe(null);
    expect(buyOrder.price).toBe(6000);
    expect(buyOrder.resultPrice).toBe(5200);
  })

  it('only executes a buy order once', async () => {
    let buyOrder: Order = null;

    const market = new MockMarket({ accountValue: 0, accountFiat: 7000 });
    market.setTicks(ticks);

    market.buy(6000, 1).then((order) => {
      buyOrder = order;
    });
    await market.tick();
    expect(market.unfullfilledOrders).toHaveLength(1);
    await market.tick();

    expect(buyOrder.resultPrice).toBe(5200);
    expect(market.unfullfilledOrders).toHaveLength(0);
  });

  it('should fill in the orderDate with the tickDate', async () => {
    // When backtesting, the order should not gain the current timestamp,
    // but the date of the given tick.
    let buyOrder: Order = null;

    const market = new MockMarket({ accountValue: 0, accountFiat: 7000 });
    market.setTicks(ticks);

    market.buy(6000, 1).then((order) => {
      buyOrder = order;
    });
    await market.tick();
    expect(market.unfullfilledOrders).toHaveLength(1);
    await market.tick();

    const tick = ticks[1];

    expect(buyOrder.date).toBe(tick.timestamp);
  });

  it('executes a sell order when it encounters a higher tick', async () => {
    let sellOrder: Order = null;

    const market = new MockMarket({ accountValue: 1, accountFiat: 0 });
    market.setTicks(ticks);

    market.sell(6100, 1).then((order) => {
      sellOrder = order;
    });

    await market.tick();
    expect(market.unfullfilledOrders).toHaveLength(1);
    await market.tick();
    await market.tick();
    await market.tick();
    await market.tick();

    expect(sellOrder.resultPrice).toBe(6200);
    expect(market.unfullfilledOrders).toHaveLength(0);
  });

  describe('should update account totals', () => {
    it('for buy limit orders', async () => {
      const market = new MockMarket({ accountValue: 0, accountFiat: 7000 });
      market.buy(6900, 1);

      expect(market.accountFiat).toBe(100);

      // buy for 6001
      market.setTicks(ticks);
      await market.tick();

      expect(market.accountFiat).toBe(7000 - 6001);
      expect(market.accountValue).toBe(1);
    });

    it('for sell limit orders', async () => {
      const market = new MockMarket({ accountValue: 1, accountFiat: 100 });
      market.sell(6100, 1);
      expect(market.accountFiat).toBe(100);
      expect(market.accountValue).toBe(0);

      market.setTicks(ticks);
      await market.tick();
      await market.tick();
      await market.tick();
      await market.tick(); // sell for 6200

      expect(market.unfullfilledOrders.length).toBe(0);
      expect(market.accountFiat).toBe(100 + 6200);
      expect(market.accountValue).toBe(0);
    });

    it('for buy market orders', async () => {
      const market = new MockMarket({ accountValue: 0, accountFiat: 7000 });
      market.createOrder(OrderType.MARKET, OrderSide.BUY, 1);

      // What should we do with this?
      // How much accountFiat should we reserve if the tick price is not known?
      // Maybe take price of previous tick with percentage?
      expect(market.accountFiat).toBe(0);

      // buy for 6001
      market.setTicks(ticks);
      await market.tick();

      expect(market.accountFiat).toBe(7000 - 6001);
      expect(market.accountValue).toBe(1);
    });

    it('for sell market orders', async () => {
      const market = new MockMarket({ accountValue: 1, accountFiat: 100 });
      market.createOrder(OrderType.MARKET, OrderSide.SELL, 1);

      // What should we do with this?
      // How much accountFiat should we reserve if the tick price is not known?
      // Maybe take price of previous tick with percentage?
      expect(market.accountValue).toBe(0);
      expect(market.accountFiat).toBe(100);

      market.setTicks(ticks);
      await market.tick(); // sold for 6001

      expect(market.accountFiat).toBe(100 + 6001);
      expect(market.accountValue).toBe(0);
    });
  });

  xit('should throw errors the account balance is too small for the market order', async () => {
    const market = new MockMarket({ accountValue: 0, accountFiat: 100 });

    expect(() => {
      market.createOrder(OrderType.MARKET, OrderSide.BUY, 2);
    }).toThrow();
  });
})
