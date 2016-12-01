import React, { PropTypes } from 'react';
import DateTime from 'react-datetime';

export default class DateControl extends React.Component {
  componentDidMount() {
    if (!this.props.value) {
      this.props.onChange(new Date());
    }
  }

  handleChange = (datetime) => {
    this.props.onChange(datetime);
  };

  render() {
    return (<DateTime
      timeFormat={false}
      value={this.props.value}
      onChange={this.handleChange}
    />);
  }
}

DateControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object, // eslint-disable-line
};
