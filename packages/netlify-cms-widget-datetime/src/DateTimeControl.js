/** @jsx jsx */
import React from 'react';
import PropTypes from 'prop-types';
import { jsx, css } from '@emotion/core';
import reactDateTimeStyles from 'react-datetime/css/react-datetime.css';
import DateTime from 'react-datetime';
import moment from 'moment';
import { buttons } from 'netlify-cms-ui-default';
import { debounce } from 'lodash';

function NowButton({ t, handleChange }) {
  return (
    <div
      css={css`
        position: absolute;
        right: 20px;
        transform: translateY(-40px);
        width: fit-content;
        z-index: 1;
      `}
    >
      <button
        css={css`
          ${buttons.button}
          ${buttons.widget}
        `}
        onClick={() => {
          handleChange(moment());
        }}
      >
        {t('editor.editorWidgets.datetime.now')}
      </button>
    </div>
  );
}

export default class DateTimeControl extends React.Component {
  static propTypes = {
    field: PropTypes.object.isRequired,
    forID: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  };

  state = { value: this.props.value };

  getFormats() {
    const { field } = this.props;
    const format = field.get('format');

    // dateFormat and timeFormat are strictly for modifying
    // input field with the date/time pickers
    const dateFormat = field.get('date_format');
    // show time-picker? false hides it, true shows it using default format
    let timeFormat = field.get('time_format');
    if (typeof timeFormat === 'undefined') {
      timeFormat = true;
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

  getPickerUtc() {
    const { field } = this.props;
    const pickerUtc = field.get('picker_utc');
    return pickerUtc;
  }

  formats = this.getFormats();
  defaultValue = this.getDefaultValue();
  pickerUtc = this.getPickerUtc();

  componentDidMount() {
    const { value } = this.props;

    /**
     * Set the current date as default value if no value is provided and default is absent. An
     * empty default string means the value is intentionally blank.
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

  debounceOnChange = debounce(value => this.props.onChange(value), 300);

  handleChange = datetime => {
    /**
     * Set the date only if it is valid.
     */
    if (!this.isValidDate(datetime)) {
      return;
    }

    const { format } = this.formats;

    /**
     * Produce a formatted string only if a format is set in the config.
     * Otherwise produce a date object.
     */
    if (format) {
      const formattedValue = datetime ? moment(datetime).format(format) : '';
      this.setState({ value: formattedValue });
      this.debounceOnChange(formattedValue);
    } else {
      const value = moment.isMoment(datetime) ? datetime.toDate() : datetime;
      this.setState({ value });
      this.debounceOnChange(value);
    }
  };

  onClose = datetime => {
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
    const { forID, classNameWrapper, setActiveStyle, t, isDisabled } = this.props;
    const { value } = this.state;
    const { format, dateFormat, timeFormat } = this.formats;

    return (
      <div
        css={css`
          ${reactDateTimeStyles};
          position: relative;
        `}
      >
        <DateTime
          dateFormat={dateFormat}
          timeFormat={timeFormat}
          value={moment(value, format)}
          onChange={this.handleChange}
          onOpen={setActiveStyle}
          onClose={this.onClose}
          inputProps={{ className: classNameWrapper, id: forID }}
          utc={this.pickerUtc}
        />
        {!isDisabled && <NowButton t={t} handleChange={v => this.handleChange(v)} />}
      </div>
    );
  }
}
