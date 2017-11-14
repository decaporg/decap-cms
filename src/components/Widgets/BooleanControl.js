import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import { isBoolean } from 'lodash';
import Switch from '../UI/Toggle/Toggle';

export default class BooleanControl extends React.Component {
  render() {
    const { value, field, forID, onChange } = this.props;
    return (
      <div className="nc-booleanControl-switch">
        <Switch
          id={forID}
          active={isBoolean(value) ? value : field.get('defaultValue', false)}
          onChange={onChange}
        />
      </div>
    );
  }
}

BooleanControl.propTypes = {
  field: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string,
  value: PropTypes.bool,
};
