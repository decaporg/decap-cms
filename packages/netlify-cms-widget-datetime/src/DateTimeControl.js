import React from 'react';
import { controlComponent as DateControl } from 'netlify-cms-widget-date';

export default class DateTimeControl extends React.Component {
  render() {
    return <DateControl {...this.props} includeTime />;
  }
}
