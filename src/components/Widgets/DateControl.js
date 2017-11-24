import PropTypes from 'prop-types';
import React from 'react';
import DateTime from 'react-datetime';
import moment from 'moment';

function format(format, value) {
  return moment(value).format(format || moment.defaultFormat);
}

export default class DateTimeControl extends React.Component {
  componentDidMount() {
    if (!this.props.value) {
      this.props.onChange(format(this.props.field.get('format'), new Date()));
    }
  }

  handleChange = (datetime) => {
    this.props.onChange(format(this.props.field.get('format'), datetime));
  };

  render() {
    return (
      <DateTime
        timeFormat={this.props.includeTime || false}
        value={moment(this.props.value, this.props.field.get('format'))}
        onChange={this.handleChange}
    />);
  }
}

DateTimeControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
  includeTime: PropTypes.bool,
  field: PropTypes.object
};


