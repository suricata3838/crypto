import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Button from '../component/Button';
import Input from '../component/Input';
import Label from '../component/Label';

const Form = styled.form`
  grid-row: 2 / 10;
  grid-column: 1 / 3;

  display: grid;
  grid-template-rows: repeat(2, auto) 1fr;
  grid-column-gap: 1rem;
  grid-row-gap: 1rem;
  grid-template-columns: repeat(2, 1fr);

  button {
    margin-top: auto;
    grid-column: 1 / -1;
  }
`;

@observer
class SimulationForm extends Component {
  static propTypes = {
    simulation: PropTypes.object.isRequired,
  };

  handleSubmit = e => {
    e.preventDefault();
    const { simulation } = this.props;
    simulation.fetch();
  };

  handleChange = e => {
    this.props.simulation[e.target.name] = e.target.value;
  };

  render() {
    const { simulation } = this.props;

    return (
      <Form onSubmit={this.handleSubmit} className="toolbar">
        <Label>
          Start date
          <Input type="date" disabled name="startDate" />
        </Label>
        <Label>
          End date
          <Input type="date" disabled name="endDate" />
        </Label>
        <Label>
          Initial btc value
          <Input name="startValue" value={simulation.startValue} onChange={this.handleChange} />
        </Label>
        <Label>
          Initial $ value
          <Input name="startFiat" value={simulation.startFiat} onChange={this.handleChange} />
        </Label>
        <Button>Start simulation</Button>
      </Form>
    );
  }
}

export default SimulationForm;
