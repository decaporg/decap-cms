import React from 'react';

export default class UnknownControl extends React.Component {
  render() {
    const { field } = this.props;
    console.log('field: %o', field.toObject());

    return <div>No control for widget '{field.get('widget')}'.</div>;
  }
}
