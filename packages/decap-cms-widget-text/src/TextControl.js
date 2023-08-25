import React from 'react';
import PropTypes from 'prop-types';
import Textarea from 'react-textarea-autosize';

export default class TextControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
  };

  /**
   * Always update to ensure `react-textarea-autosize` properly calculates
   * height. Certain situations, such as this widget being nested in a list
   * item that gets rearranged, can leave the textarea in a minimal height
   * state. Always updating this particular widget should generally be low cost,
   * but this should be optimized in the future.
   */
  shouldComponentUpdate() {
    return true;
  }

  render() {
    const { forID, value, onChange, classNameWrapper, setActiveStyle, setInactiveStyle } =
      this.props;

    return (
      <Textarea
        id={forID}
        value={value || ''}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        minRows={5}
        css={{ fontFamily: 'inherit' }}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
}
