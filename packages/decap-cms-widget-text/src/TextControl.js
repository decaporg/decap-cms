import React from 'react';
import PropTypes from 'prop-types';
import { TextareaField } from 'decap-cms-ui-next';

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
    const {
      forID,
      label,
      status,
      placeholder,
      description,
      inline,
      value,
      onChange,
      error,
      errors,
    } = this.props;

    return (
      <TextareaField
        name={forID}
        label={label}
        status={status}
        placeholder={placeholder}
        description={description}
        inline={inline}
        value={value || ''}
        minRows={5}
        onChange={e => onChange(e.target.value)}
        error={error}
        errors={errors}
      />
    );
  }
}
