import PropTypes from 'prop-types';
import React from 'react';
import DateTimeControl from './DateTimeControl';
import DateTime from 'react-datetime';
import { Map } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';

export default class DateControl extends React.Component {
  render() {
    return (<DateTimeControl
      {...this.props}
      options={this.props.field.updateIn([ 'options' ], (val = Map({})) => val.set('timeFormat', false))}
      onChange={(datetime) => this.props.onChange(datetime)}
    />);
  }
}

DateControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
  options: ImmutablePropTypes.mapContains({
    dateFormat: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.bool,
    ]),
  })
};
