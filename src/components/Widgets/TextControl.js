import PropTypes from 'prop-types';
import React from 'react';
import Textarea from 'react-textarea-autosize';

export default class TextControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
  };

  /**
   * Always update to ensure `react-textarea-autosize` properly calculates
   * height. Certain situations, such as this widget being nested in a list
   * item that gets rearranged, can leave the textarea in a minimal height
   * state. Always updating should generally be low cost, but this should be
   * optimized in the future.
   */
  shouldComponentUpdate(nextProps) {
    return true;
  }

  render() {
    console.log('rendering');
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
