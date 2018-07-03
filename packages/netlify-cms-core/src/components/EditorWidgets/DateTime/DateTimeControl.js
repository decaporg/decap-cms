import React from 'react';
import PropTypes from 'prop-types';
import DateControl from 'EditorWidgets/Date/DateControl';

export default class DateTimeControl extends React.Component {
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
    format: PropTypes.string,
  };

  render() {
    const {
      field,
      format,
      onChange,
      value,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle
    } = this.props;

    return (
      <DateControl
        onChange={onChange}
        format={format}
        value={value}
        field={field}
        classNameWrapper={classNameWrapper}
        setActiveStyle={setActiveStyle}
        setInactiveStyle={setInactiveStyle}
        includeTime
      />
    );
  }
}
