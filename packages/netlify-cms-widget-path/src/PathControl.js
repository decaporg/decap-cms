import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';

export default class PathControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    entry: ImmutablePropTypes.map.isRequired,
    collection: ImmutablePropTypes.map.isRequired,
    metadata: ImmutablePropTypes.map,
  };

  onChange = e => {
    const newValue = e.target.value;
    const { onChange, field } = this.props;
    onChange(undefined, { [field.get('name')]: { path: newValue } });
  };

  shouldComponentUpdate() {
    return true;
  }

  getPath() {
    const { entry, metadata, collection, value } = this.props;
    if (value) {
      return value;
    }
    if (metadata) {
      return metadata.get('path');
    }
    return entry?.get('path').substring(collection.get('folder').length + 1) || '';
  }

  getValidateValue = () => {
    return this.getPath();
  };

  render() {
    const { forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;

    const value = this.getPath();

    return (
      <input
        type="text"
        id={forID}
        className={classNameWrapper}
        value={value}
        onChange={this.onChange}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
      />
    );
  }
}
