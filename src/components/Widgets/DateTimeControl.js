import React, { PropTypes } from 'react';
import DateTime from 'react-datetime';

export default class DateTimeControl extends React.Component {
  handleChange = (datetime) => {
    this.props.onChange(datetime);
  };

  render() {
    return <DateTime value={this.props.value || new Date()} onChange={this.handleChange} />;
  }
}

DateTimeControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object,
};
