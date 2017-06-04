import React, { PropTypes } from 'react';
import DateTime from 'react-datetime';

export default class DateTimeControl extends React.Component {
  componentDidMount() {
    if (!this.props.value) {
      this.props.onChange(new Date());
    }
  }

  handleChange = (datetime) => {
    this.props.onChange(datetime);
  };

  render() {
    return <DateTime value={this.props.value} onChange={this.handleChange} />;
  }
}

DateTimeControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
};
