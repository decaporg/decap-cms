import PropTypes from 'prop-types';
import React from 'react';
import Textarea from 'react-textarea-autosize';

export default class TextControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
  };

  render() {
    const {forID, value = '', onChange } = this.props;

    return (
      <Textarea
        id={forID}
        value={value}
        style={{ minHeight: '140px' }}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
}
