import React from 'react';
import NetlifyCmsWidgetDate from 'netlify-cms-widget-date';

const DateControl = NetlifyCmsWidgetDate.controlComponent;

export default class DateTimeControl extends React.Component {
  render() {
    return <DateControl {...this.props} includeTime />;
  }
}
