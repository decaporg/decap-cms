/** @jsx jsx */
import React from 'react';
import PropTypes from 'prop-types';
import { jsx, css } from '@emotion/react';
import dayjs from 'dayjs';
import { buttons } from 'decap-cms-ui-default';

const customParseFormat = require('dayjs/plugin/customParseFormat');
var localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

function Buttons({ t, handleChange, inputFormat }) {
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
        onClick={() => handleChange(dayjs().format(inputFormat))}
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
    const format = field.get('format');
    const dateFormat = field.get('date_format');
    const timeFormat = field.get('time_format');
    let inputType = 'datetime-local';
    let inputFormat = 'YYYY-MM-DDTHH:mm';

    if (dateFormat && timeFormat) {
      return { format: `${dateFormat}T${timeFormat}`, inputType, inputFormat };
    } else if (timeFormat) {
      inputType = 'time';
      inputFormat = 'HH:mm';
      return { format: timeFormat, inputType, inputFormat };
    } else if (dateFormat) {
      inputType = 'date';
      inputFormat = 'YYYY-MM-DD';
      return { format: dateFormat, inputType, inputFormat };
    } else if (format) {
      return { format, inputType, inputFormat };
    } else {
      return { format: 'YYYY-MM-DDTHH:mm', inputType, inputFormat };
    }
  }

  getDefaultValue() {
    const { field } = this.props;
    const defaultValue = field.get('default');
    return defaultValue;
  }

  formatInputValue(value) {
    const { format, inputFormat } = this.getFormat();
    let formattedValue = dayjs(value).format(inputFormat);
    if (!dayjs(formattedValue).isValid()) {
      formattedValue = dayjs(value, format).format(inputFormat);
    }
    return formattedValue;
  }

  isValidDate = datetime => dayjs.isDayjs(datetime) || datetime === '';

  handleChange = datetime => {
    if (!this.isValidDate(datetime)) return;

    const { format, inputFormat } = this.getFormat();
    const formattedValue = datetime ? dayjs(datetime, inputFormat).format(format) : '';

    const { onChange } = this.props;
    onChange(formattedValue);
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
          onChange={e => this.handleChange(dayjs(e.target.value))}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          disabled={isDisabled}
        />
        {!isDisabled && <Buttons t={t} handleChange={v => this.handleChange(v)} inputFormat={inputFormat} />}
      </div>
    );
  }
}

export default DateTimeControl;
