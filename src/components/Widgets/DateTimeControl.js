import React from 'react';
import DateControl from './DateControl';

export default class DateTimeControl extends React.Component {
  render() {
    const {onChange, format, value, field} = this.props;
    return <DateControl onChange={onChange} format={format} value={value} field={field} includeTime={true}/>;
  }
};