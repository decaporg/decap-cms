import React from 'react';
import PropTypes from 'prop-types';
import DateTime from 'react-datetime';
import moment from 'moment';

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
const DEFAULT_DATETIME_FORMAT = moment.defaultFormat;

export default class DateControl extends React.Component {
  static propTypes = {
    field: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string,
    ]),
    includeTime: PropTypes.bool,
  };

  format = this.props.field.get('format') || (this.props.includeTime ? DEFAULT_DATETIME_FORMAT : DEFAULT_DATE_FORMAT);

  componentDidMount() {
    const { value } = this.props;

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
    const { includeTime, value, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;
    const format = this.format;
    return (
      <DateTime
        timeFormat={!!includeTime}
        value={moment(value, format)}
        onChange={this.handleChange}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        inputProps={{ className: classNameWrapper }}
      />
    );
  }
}
