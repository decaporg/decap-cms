import React, { PropTypes } from 'react';
import DateTime from 'react-datetime';

export default class DateControl extends React.Component {
  handleChange = (datetime) => {
    this.props.onChange(datetime);
  };

  render() {
    return (<DateTime
      timeFormat={false}
      value={this.props.value || new Date()}
      onChange={this.handleChange}
    />);
  }
}

DateControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object,
};
