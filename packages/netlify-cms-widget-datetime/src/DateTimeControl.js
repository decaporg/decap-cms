import React from 'react';
import NetlifyCmsWidgetDate from 'netlify-cms-widget-date';
import moment from 'moment';

const DateControl = NetlifyCmsWidgetDate.controlComponent;

export default class DateTimeControl extends React.Component {
  static createDefaultValue = () => {  return moment() };

  render() {
    return <DateControl {...this.props} includeTime />;
  }
}
