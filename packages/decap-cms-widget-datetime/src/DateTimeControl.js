/** @jsx jsx */
import React from 'react';
import PropTypes from 'prop-types';
import { jsx } from '@emotion/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import { DatetimeField } from 'decap-cms-ui-next';

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(utc);

class DateTimeControl extends React.Component {
  static propTypes = {
    field: PropTypes.object.isRequired,
    forID: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
    status: PropTypes.string,
    description: PropTypes.string,
    inline: PropTypes.bool,
    error: PropTypes.bool,
    errors: PropTypes.array,
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    t: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
  };

  static defaultProps = {
    isDisabled: false,
  };

  getFormat() {
    const { field } = this.props;
    const format = field?.get('format') || 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';
    const dateFormat = field?.get('date_format');
    const timeFormat = field?.get('time_format');
    let inputFormat = 'YYYY-MM-DDTHH:mm';
    let inputType = 'datetime-local';

    if (dateFormat && timeFormat) {
      return { format: `${dateFormat}T${timeFormat}`, inputType, inputFormat };
    }

    if (timeFormat) {
      inputType = 'time';
      inputFormat = 'HH:mm';
      return { format: timeFormat, inputType, inputFormat };
    }

    if (dateFormat) {
      inputType = 'date';
      inputFormat = 'YYYY-MM-DD';
      return { format: dateFormat, inputType, inputFormat };
    }

    return { format, inputType, inputFormat };
  }

  getDefaultValue() {
    const { field } = this.props;
    const defaultValue = field.get('default');
    return defaultValue;
  }

  shortcuts({ t, isUtc }) {
    return {
      [t('editor.editorWidgets.datetime.now')]: isUtc ? dayjs.utc() : dayjs(),
      [t('editor.editorWidgets.datetime.clear')]: '',
    };
  }

  isUtc = this.props.field.get('picker_utc') || false;
  isValidDate = datetime => dayjs(datetime).isValid() || datetime === '';
  defaultValue = this.getDefaultValue();

  componentDidMount() {
    const { value } = this.props;
    const { inputFormat } = this.getFormat();
    if (value === undefined) {
      setTimeout(() => {
        this.handleChange(
          this.defaultValue === undefined ? dayjs().format(inputFormat) : this.defaultValue,
        );
      }, 0);
    }
  }

  onInputChange = date => {
    const { onChange } = this.props;

    onChange(date);
  };

  render() {
    const { forID, value, classNameWrapper, setActiveStyle, setInactiveStyle, t, isDisabled } =
      this.props;
    const { inputType, inputFormat } = this.getFormat();

    return (
      <div className={classNameWrapper}>
        <DatetimeField
          name={forID}
          type={inputType}
          format={inputFormat}
          value={dayjs(value)}
          shortcuts={this.shortcuts({
            t,
            isUtc: this.isUtc,
          })}
          onChange={this.onInputChange}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          disabled={isDisabled}
        />
      </div>
    );
  }
}

export default DateTimeControl;
