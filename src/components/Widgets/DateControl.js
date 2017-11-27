import PropTypes from 'prop-types';
import React from 'react';
import DateTime from 'react-datetime';
import moment from 'moment';

export default class DateControl extends React.Component {
  componentDidMount() {
    const { value, field, onChange } = this.props;
    if (!value) {
      const format = field.get('format');
      const newValue = format
        ? moment(new Date()).format(format)
        : new Date();
      onChange(newValue);
    }
  }

  handleChange = (datetime) => {
    const { onChange, field } = this.props;
    const format = field.get('format');
    const newValue = format
      ? moment(datetime).format(format)
      : datetime;
    onChange(newValue);
  };

  render() {
    const { field, includeTime, value } = this.props;
    const format = field.get('format', moment.defaultFormat);
    return (<DateTime
      timeFormat={!!includeTime}
      value={moment(value, format)}
      onChange={this.handleChange}
    />);
  }
}

DateControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
  includeTime: PropTypes.bool,
  field: PropTypes.object,
};
