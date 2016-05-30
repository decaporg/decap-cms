import React from 'react';

export default class UnknownPreview extends React.Component {
  render() {
    const { field } = this.props;

    return <div>No preview for widget '{field.widget}'.</div>;
  }
}
