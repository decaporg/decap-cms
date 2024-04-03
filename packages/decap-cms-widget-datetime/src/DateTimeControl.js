/** @jsx jsx */
import React from 'react';
import PropTypes from 'prop-types';
import { jsx, css } from '@emotion/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import { buttons } from 'decap-cms-ui-default';

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(utc);

function Buttons({ t, handleChange, inputFormat, isUtc }) {
  return (
    <div
      css={css`
        display: flex;
        gap: 20px;
        width: fit-content;
      `}
    >
      <button
        css={css`
          ${buttons.button}
          ${buttons.widget}
        `}
        onClick={() =>
          handleChange(isUtc ? dayjs.utc().format(inputFormat) : dayjs().format(inputFormat))
        }
      >
        {t('editor.editorWidgets.datetime.now')}
      </button>
      <button
        css={css`
          ${buttons.button}
          ${buttons.widget}
        `}
        onClick={() => handleChange('')}
      >
        {t('editor.editorWidgets.datetime.clear')}
      </button>
    </div>
  );
}

class DateTimeControl extends React.Component {
  static propTypes = {
    field: PropTypes.object.isRequired,
    forID: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
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

  formatInputValue(value) {
    if (value === '') return value;
    const { format, inputFormat } = this.getFormat();
    let formattedValue = this.isUtc
      ? dayjs.utc(value).format(inputFormat)
      : dayjs(value).format(inputFormat);
    if (!this.isValidDate(formattedValue)) {
      formattedValue = this.isUtc
        ? dayjs.utc(value, format).format(inputFormat)
        : dayjs(value, format).format(inputFormat);
    }
    return formattedValue;
  }

  handleChange = datetime => {
    if (!this.isValidDate(datetime)) return;
    const { onChange } = this.props;

    if (datetime === '') {
      onChange('');
    } else {
      const { format, inputFormat } = this.getFormat();
      const formattedValue = dayjs(datetime, inputFormat).format(format);
      onChange(formattedValue);
    }
  };

  onInputChange = e => {
    const etv = e.target.value;
    const newValue = dayjs(etv);
    this.handleChange(etv === '' ? '' : newValue);
  };

  render() {
    const { forID, value, classNameWrapper, setActiveStyle, setInactiveStyle, t, isDisabled } =
      this.props;
    const { inputType, inputFormat } = this.getFormat();

    return (
      <div
        className={classNameWrapper}
        css={css`
          display: flex !important;
          gap: 20px;
          align-items: center;
        `}
      >
        <input
          id={forID}
          type={inputType}
          value={this.formatInputValue(value)}
          onChange={this.onInputChange}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          disabled={isDisabled}
        />
        {!isDisabled && (
          <Buttons
            t={t}
            handleChange={v => this.handleChange(v)}
            inputFormat={inputFormat}
            isUtc={this.isUtc}
          />
        )}
      </div>
    );
  }
}

export default DateTimeControl;
