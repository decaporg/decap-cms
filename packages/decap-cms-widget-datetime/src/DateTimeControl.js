/** @jsx jsx */
import React from 'react';
import PropTypes from 'prop-types';
import { jsx, css } from '@emotion/react';
import dayjs from 'dayjs';
import { buttons } from 'decap-cms-ui-default';

function Buttons({ t, handleChange }) {
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
        onClick={() => handleChange(dayjs())}
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

  getFormat() {
    const { field } = this.props;
    const format = field.get('format');
    return format;
  }

  getDefaultValue() {
    const { field } = this.props;
    const defaultValue = field.get('default');
    return defaultValue;
  }

  format = this.getFormat();
  defaultValue = this.getDefaultValue();

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

  // Date is valid if datetime is a dayjs or Date object otherwise it's a string.
  // Handle the empty case, if the user wants to empty the field.
  isValidDate = datetime => dayjs.isDayjs(datetime) || datetime instanceof Date || datetime === '';

  handleChange = datetime => {
    /**
     * Set the date only if it is valid.
     */
    if (!this.isValidDate(datetime)) {
      return;
    }

    const { onChange } = this.props;

    /**
     * Produce a formatted string only if a format is set in the config.
     * Otherwise produce a date object.
     */
    if (this.format) {
      const formattedValue = datetime ? dayjs(datetime).format(this.format) : '';
      onChange(formattedValue);
    } else {
      const value = dayjs.isDayjs(datetime) ? datetime.toDate() : datetime;
      onChange(value);
    }
  };

  render() {
    const { forID, value, classNameWrapper, setActiveStyle, setInactiveStyle, t, isDisabled } =
      this.props;

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
          type="datetime-local"
          value={dayjs(value).format('YYYY-MM-DDTHH:mm')}
          onChange={e => this.handleChange(dayjs(e.target.value))}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          disabled={isDisabled}
        />
        {!isDisabled && <Buttons t={t} handleChange={v => this.handleChange(v)} />}
      </div>
    );
  }
}
