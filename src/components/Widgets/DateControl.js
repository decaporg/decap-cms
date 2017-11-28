import PropTypes from 'prop-types';
import React from 'react';
import DateTime from 'react-datetime';
import moment from 'moment';

export default class DateControl extends React.Component {
  componentDidMount() {
    const { value, field, onChange } = this.props;
    this.format = field.get('format');

    /**
     * Set the current date as default value if no default value is provided. An
     * empty string means the value is intentionally blank.
     */
    if (!value && value !== '') {
      this.handleChange(new Date());
    }
  }

  handleChange = datetime => {
    const { onChange } = this.props;
    if (!this.format || datetime === '') {
      onChange(datetime);
    } else {
      const formattedValue = moment(datetime).format(this.format);
      onChange(formattedValue);
    }
  };

  render() {
    const { includeTime, value } = this.props;
    const format = this.format || moment.defaultFormat;
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
