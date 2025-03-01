import React from 'react';
import PropTypes from 'prop-types';
import { zipObject } from 'lodash';
import { scaleTime } from 'd3-scale';
import { utcDay } from 'd3-time';
import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';

import { ChartCanvas, Chart } from 'react-stockcharts';
import styled from 'styled-components';
import {
  CrossHairCursor,
  MouseCoordinateX,
  CurrentCoordinate,
  MouseCoordinateY,
} from 'react-stockcharts/lib/coordinates';
import { Annotate, SvgPathAnnotation, buyPath, sellPath } from 'react-stockcharts/lib/annotation';
import { ema } from 'react-stockcharts/lib/indicator';
import { CandlestickSeries, LineSeries } from 'react-stockcharts/lib/series';
import { MovingAverageTooltip } from 'react-stockcharts/lib/tooltip';
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
import { fitDimensions } from 'react-stockcharts/lib/helper';
import { last, timeIntervalBarWidth } from 'react-stockcharts/lib/utils';

import { observer } from 'mobx-react';
import {
  COLOR_NEUTRAL,
  COLOR_POSITIVE,
  COLOR_NEGATIVE,
  COLOR_NEGATIVE_2,
  COLOR_POSITIVE_2,
} from '../utils/colors';

const toDateString = d => d.date.toISOString().substring(0, 10);

const sellProps = {
  fill: COLOR_NEGATIVE_2,
  path: sellPath,
  tooltip: 'Sell',
};

const buyProps = {
  fill: COLOR_POSITIVE_2,
  path: buyPath,
  tooltip: 'Buy',
};

const candleAppearance = {
  // wickStore: 'hotpink',
  fill: function fill(d) {
    return d.close > d.open ? COLOR_POSITIVE : COLOR_NEGATIVE;
  },
  stroke: 'none',
  candleStrokeWidth: 1,
  widthRatio: 0.8,
  opacity: 1,
};

const StyledCanvas = styled(ChartCanvas)`
  .react-stockcharts-y-axis text,
  .react-stockcharts-x-axis text {
    fill: ${COLOR_NEUTRAL};
  }

  .react-stockcharts-candlestick-wick path.up {
    stroke: ${COLOR_POSITIVE};
  }

  .react-stockcharts-candlestick-wick path.down {
    stroke: ${COLOR_NEGATIVE};
  }

  .react-stockcharts-tooltip tspan {
    opacity: 0.5;
    fill: ${COLOR_NEUTRAL};
  }

  tspan.react-stockcharts-tooltip-label {
    opacity: 1;
    fill: ${COLOR_NEUTRAL};
  }

  .react-stockcharts-axis-domain {
    display: none;
  }
`;

class CandleStickChart extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    ratio: PropTypes.number.isRequired,
    simulation: PropTypes.object.isRequired,
  };

  filterCandleOnOrderDate(orders) {
    return candle => {
      const orderDates = orders.map(o => o.date.substring(0, 10));
      return orderDates.includes(toDateString(candle));
    };
  }

  generateOrderPriceSelector(orders) {
    const orderDates = orders.map(o => o.date.substring(0, 10));
    const mappedOrders = zipObject(orderDates, orders);

    return ({ yScale, datum }) => {
      const date = toDateString(datum);
      const order = mappedOrders[date];
      return yScale(parseInt(order.resultPrice / 100, 10));
    };
  }

  render() {
    const { width, height, data, ratio, simulation } = this.props;
    const orders = simulation.orders || [];
    const xAccessor = d => d.date;
    const xExtents = [xAccessor(last(data)), xAccessor(data[0])];

    const emaA = ema()
      .options({
        windowSize: 14,
      })
      .merge((d, c) => {
        d.emaA = c;
      })
      .accessor(d => d.emaA);

    const emaB = ema()
      .options({
        windowSize: 7,
      })
      .merge((d, c) => {
        d.emaB = c;
      })
      .accessor(d => d.emaB);

    const buyOrders = orders.filter(o => o.side === 'buy');
    const sellOrders = orders.filter(o => o.side === 'sell');

    const enhancedBuyProps = {
      ...buyProps,
      y: this.generateOrderPriceSelector(buyOrders),
    };
    const enhancedSellProps = {
      ...sellProps,
      y: this.generateOrderPriceSelector(sellOrders),
    };

    const calculatedData = emaA(emaB(data));

    return (
      <StyledCanvas
        height={height}
        ratio={ratio}
        width={width}
        margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
        type="svg"
        seriesName="MSFT"
        data={calculatedData}
        xAccessor={xAccessor}
        xScale={scaleTime()}
        xExtents={xExtents}
      >
        <Chart id={1} yExtents={d => [d.high, d.low]}>
          <XAxis axisAt="bottom" orient="bottom" ticks={6} />
          <YAxis axisAt="left" orient="left" ticks={5} />
          <MouseCoordinateX at="bottom" orient="bottom" displayFormat={timeFormat('%Y-%m-%d')} />
          <MouseCoordinateY at="left" orient="left" displayFormat={format('.0f')} />
          <LineSeries yAccessor={emaA.accessor()} stroke={emaA.stroke()} />
          <LineSeries yAccessor={emaB.accessor()} stroke={emaB.stroke()} />
          <CurrentCoordinate yAccessor={emaA.accessor()} fill={emaA.stroke()} />
          <MovingAverageTooltip
            onClick={e => console.error(e)}
            origin={[20, 0]}
            options={[
              {
                yAccessor: emaA.accessor(),
                type: 'EMA',
                stroke: emaA.stroke(),
                windowSize: emaA.options().windowSize,
              },
              {
                yAccessor: emaB.accessor(),
                type: 'EMA',
                stroke: emaB.stroke(),
                windowSize: emaB.options().windowSize,
              },
            ]}
          />
          <CandlestickSeries width={timeIntervalBarWidth(utcDay)} {...candleAppearance} />
          {simulation.orders && (
            <React.Fragment>
              <Annotate
                with={SvgPathAnnotation}
                when={this.filterCandleOnOrderDate(buyOrders)}
                usingProps={enhancedBuyProps}
              />
              <Annotate
                with={SvgPathAnnotation}
                when={this.filterCandleOnOrderDate(sellOrders)}
                usingProps={enhancedSellProps}
              />
            </React.Fragment>
          )}
        </Chart>
        <CrossHairCursor stroke="#FFFFFF" />
      </StyledCanvas>
    );
  }
}

export default fitDimensions(observer(CandleStickChart));
