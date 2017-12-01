import React from 'react';
import DateControl from 'EditorWidgets/Date/DateControl';

export default class DateTimeControl extends React.Component {
  render() {
    const { field, format, onChange, value, className } = this.props;
    return (
      <DateControl
        onChange={onChange}
        format={format}
        value={value}
        field={field}
        className={className}
        includeTime
      />
    );
  }
}
