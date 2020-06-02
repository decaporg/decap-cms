import React from 'react';
import PropTypes from 'prop-types';

export default class StringControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
    classNameWrapper: PropTypes.string.isRequired,
    validate: PropTypes.func.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
  };

  handleBlur = () => {
    const { setInactiveStyle, validate } = this.props;
    setInactiveStyle();
    validate();
  };

  render() {
    const { forID, value, onChange, classNameWrapper, setActiveStyle } = this.props;

    return (
      <input
        type="text"
        id={forID}
        className={classNameWrapper}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        onFocus={setActiveStyle}
        onBlur={this.handleBlur}
      />
    );
  }
}
