import React from 'react';
import PropTypes from 'prop-types';

import { scaleTime } from 'd3-scale';
import { utcDay } from 'd3-time';
import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';

import { ChartCanvas, Chart } from 'react-stockcharts';
import {
  CrossHairCursor,
  MouseCoordinateX,
  MouseCoordinateY,
} from 'react-stockcharts/lib/coordinates';
import { CandlestickSeries } from 'react-stockcharts/lib/series';
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
import { fitWidth } from 'react-stockcharts/lib/helper';
import { last, timeIntervalBarWidth } from 'react-stockcharts/lib/utils';

@fitWidth
export default class CandleStickChart extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired,
    ratio: PropTypes.number.isRequired,
  };
  render() {
    const { width, data, ratio } = this.props;
    const xAccessor = d => d.date;
    const xExtents = [xAccessor(last(data)), xAccessor(data[0])];
    return (
      <ChartCanvas
        height={400}
        ratio={ratio}
        width={width}
        margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
        type="svg"
        seriesName="MSFT"
        data={data}
        xAccessor={xAccessor}
        xScale={scaleTime()}
        xExtents={xExtents}
      >
        <Chart id={1} yExtents={d => [6000, 11000]}>
          <XAxis axisAt="bottom" orient="bottom" ticks={6} />
          <YAxis axisAt="left" orient="left" ticks={5} />
          <MouseCoordinateX
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat('%Y-%m-%d')}
          />
          <MouseCoordinateY
            at="left"
            orient="left"
            displayFormat={format('.0f')}
          />
          <CandlestickSeries width={timeIntervalBarWidth(utcDay)} />
        </Chart>
        <CrossHairCursor />
      </ChartCanvas>
    );
  }
}
