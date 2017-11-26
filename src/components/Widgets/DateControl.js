import PropTypes from 'prop-types';
import React from 'react';
import DateTime from 'react-datetime';
import moment from 'moment';

function format(format, value) {
  if (format) {
    return moment(value).format(format || moment.defaultFormat);
  }
  return value;
}

function toDate(format, value) {
  if (format) {
    return moment(value, format);
  }
  return value;
}

export default class DateTimeControl extends React.Component {
  componentDidMount() {
    const {value, field, onChange} = this.props;
    if (!value) {
      if (field.get('format')) {
        onChange(format(field.get('format'), new Date()));
      } else {
        onChange(new Date());
      }
    }
  }

  handleChange = (datetime) => {
    this.props.onChange(format(this.props.field.get('format'), datetime));
  };

  render() {
    return (
      <DateTime
        timeFormat={this.props.includeTime || false}
        value={toDate(this.props.field.get('format'), this.props.value)}
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


