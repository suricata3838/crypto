import { round } from 'lodash';
import Tick from '../../models/tick';
import BaseStrategy from '../base';

// Dummy strategy, buys at 7000, sells at 9500
// Without state: doesn't check how much fund is available or active orders
class SimpleStrategy extends BaseStrategy {
  handleTick(tick: Tick) {
    const value = tick.last;

    if (value <= 7000) {
      this.signalBuy(tick);
    }

    if (value >= 9500) {
      this.signalSell(tick);
    }
  }

  // Buy if we have no crypto
  signalBuy(tick: Tick) {
    if (this.quantity === 0) {
      this.market.buy(tick.last, 0.1);
      this.quantity = 0.1;
    }
  }

  signalSell(tick: Tick) {
    if (this.quantity > 0) {
      this.market.sell(tick.last, 0.1);
      this.quantity = 0;
    }
  }
}

export default SimpleStrategy;
