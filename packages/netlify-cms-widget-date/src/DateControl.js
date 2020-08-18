import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/core';
import reactDateTimeStyles from 'react-datetime/css/react-datetime.css';
import DateTime from 'react-datetime';
import moment from 'moment';

import { once } from 'lodash';
import { oneLine } from 'common-tags';

const warnDeprecated = once(() =>
  console.warn(oneLine`
  Netlify CMS config: the date widget has been deprecated and will
  be removed in the next major release. Please use the datetime widget instead.
`),
);

/**
 * `date` widget is deprecated in favor of the `datetime` widget
 */
export default class DateControl extends React.Component {
  static propTypes = {
    field: PropTypes.object.isRequired,
    forID: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    includeTime: PropTypes.bool,
  };

  getFormats() {
    const { field, includeTime } = this.props;
    const format = field.get('format');

    // dateFormat and timeFormat are strictly for modifying
    // input field with the date/time pickers
    const dateFormat = field.get('date_format');
    // show time-picker? false hides it, true shows it using default format
    let timeFormat = field.get('time_format');
    if (typeof timeFormat === 'undefined') {
      timeFormat = !!includeTime;
    }

    return {
      format,
      dateFormat,
      timeFormat,
    };
  }

  getDefaultValue() {
    const { field } = this.props;
    const defaultValue = field.get('default');
    return defaultValue;
  }

  formats = this.getFormats();
  defaultValue = this.getDefaultValue();

  componentDidMount() {
    warnDeprecated();
    const { value } = this.props;

    /**
     * Set the current date as default value if no default value is provided. An
     * empty string means the value is intentionally blank.
     */
    if (value === undefined) {
      setTimeout(() => {
        this.handleChange(this.defaultValue === undefined ? new Date() : this.defaultValue);
      }, 0);
    }
  }

  // Date is valid if datetime is a moment or Date object otherwise it's a string.
  // Handle the empty case, if the user wants to empty the field.
  isValidDate = datetime =>
    moment.isMoment(datetime) || datetime instanceof Date || datetime === '';

  handleChange = datetime => {
    /**
     * Set the date only if it is valid.
     */
    if (!this.isValidDate(datetime)) {
      return;
    }

    const { onChange } = this.props;
    const { format } = this.formats;

    /**
     * Produce a formatted string only if a format is set in the config.
     * Otherwise produce a date object.
     */
    if (format) {
      const formattedValue = datetime ? moment(datetime).format(format) : '';
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
    const { forID, value, classNameWrapper, setActiveStyle } = this.props;
    const { format, dateFormat, timeFormat } = this.formats;
    return (
      <div
        css={css`
          ${reactDateTimeStyles};
        `}
      >
        <DateTime
          dateFormat={dateFormat}
          timeFormat={timeFormat}
          value={moment(value, format)}
          onChange={this.handleChange}
          onFocus={setActiveStyle}
          onBlur={this.onBlur}
          inputProps={{ className: classNameWrapper, id: forID }}
        />
      </div>
    );
  }
}
