import { round, remove } from 'lodash';
import { Order, OrderType } from '../market';
import Tick from '../models/tick';
import MockMarket from '../market/mock';
import BaseStrategy from '../strategy/base';

class Trade {
  buyPrice: number;
  sellPrice: number;
  result: number;
  buyDate: Date;
  sellDate: Date;

  constructor(order: Order) {
    this.buyPrice = order.price;
    this.buyDate = order.date;
  }

  sell(order: Order) {
    this.sellPrice = order.price;
    this.sellDate = order.date;
    this.result = round((100 * order.price) / this.buyPrice, 1);
  }
}

/*
 * A backtest simulation for a crypto strategy
 *
 * Feeds ticks to a strategy.
 * Supplies the strategy with a Market interface
 * Keeps track of the orders placed in the market
 * and tries to bundle them into trades.
 */
class Simulation {
  market: MockMarket;
  ticks: Tick[];
  orders: Order[] = [];
  trades: Trade[] = [];
  private openTrades: Trade[] = [];
  strategy: BaseStrategy;

  constructor({
    strategy,
    market,
  }: {
    strategy: BaseStrategy;
    market: MockMarket;
  }) {
    this.market = market;
    this.market.onPlaceOrder = this.handleOrder.bind(this);
    this.strategy = strategy;
  }

  async run() {
    while (this.market.hasTicks) {
      await this.market.tick();
    }
  }

  handleOrder(order: Order) {
    this.orders.push(order);
    // this.openTrades.push(new Trade(order));
    this.matchOrderIntoTrades(order);
  }

  matchOrderIntoTrades(order: Order) {
    if (order.type === OrderType.SELL && this.openTrades.length === 0) {
      const startingTrade = new Trade(order);
      startingTrade.buyPrice = null;
      startingTrade.buyDate = null;
      startingTrade.sellPrice = order.price;
      startingTrade.sellDate = order.date;
      this.trades.push(startingTrade)
      return;
    }

    // TODO, iff sellTrades.length === 0;
    if (this.openTrades.length === 0) {
      this.openTrades.push(new Trade(order));
      return;
    }

    // TODY, close off buy orders by checking quantity
    const trade = this.openTrades[0];
    trade.sell(order);
    remove(this.openTrades, (trade: Trade) => {
      return true;
    })
    this.trades.push(trade);
  }
}

export default Simulation;
