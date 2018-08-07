import React from 'react';
import PropTypes from 'prop-types';
import { injectGlobal } from 'react-emotion';
import DateTime from 'react-datetime';
import dateTimeStyles from 'react-datetime/css/react-datetime.css';
import moment from 'moment';

injectGlobal`
  ${dateTimeStyles}
`;

export default class DateControl extends React.Component {
  static propTypes = {
    field: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    includeTime: PropTypes.bool,
  };

  format = this.props.field.get('format');

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

  // Date is valid if datetime is a moment or Date object otherwise it's a string.
  // Handle the empty case, if the user wants to empty the field.
  isValidDate = datetime =>
    moment.isMoment(datetime) || datetime instanceof Date || datetime === '';

  handleChange = datetime => {
    const { onChange } = this.props;

    /**
     * Set the date only if it is valid.
     */
    if (!this.isValidDate(datetime)) {
      return;
    }

    /**
     * Produce a formatted string only if a format is set in the config.
     * Otherwise produce a date object.
     */
    if (this.format) {
      const formattedValue = moment(datetime).format(this.format);
      onChange(formattedValue);
    } else {
      const value = moment.isMoment(datetime) ? datetime.toDate() : datetime;
      onChange(value);
    }
  };

  onBlur = datetime => {
    const { setInactiveStyle } = this.props;

    if (!this.isValidDate(datetime)) {
      const parsedDate = moment(datetime);

      if (parsedDate.isValid()) {
        this.handleChange(datetime);
      } else {
        window.alert('The date you entered is invalid.');
      }
    }

    setInactiveStyle();
  };

  render() {
    const { includeTime, value, classNameWrapper, setActiveStyle } = this.props;
    return (
      <DateTime
        timeFormat={!!includeTime}
        value={moment(value, this.format)}
        onChange={this.handleChange}
        onFocus={setActiveStyle}
        onBlur={this.onBlur}
        inputProps={{ className: classNameWrapper }}
      />
    );
  }
}
