import React from 'react';
import DateControl from './DateControl';

export default class DateTimeControl extends React.Component {
  render() {
    const { field, format, onChange, value } = this.props;
    return <DateControl onChange={onChange} format={format} value={value} field={field} includeTime />;
  }
}
