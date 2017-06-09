import React, { PropTypes } from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import Switch from 'react-toolbox/lib/switch';
import { isBoolean } from 'lodash';
import styles from './BooleanControl.css';

export default class BooleanControl extends React.Component {
  render() {
    const { value, field, forID, onChange } = this.props;
    return (
      <Switch
        id={forID}
        className={styles.switch}
        checked={isBoolean(value) ? value : field.get('defaultValue', false)}
        onChange={onChange}
      />
    );
  }
}

BooleanControl.propTypes = {
  field: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string,
  value: PropTypes.bool,
};
