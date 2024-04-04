import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { BooleanInput } from 'decap-cms-ui-next';

export default class BooleanControl extends React.Component {
  render() {
    const { label, status, description, value, forID, inline, onChange, error, errors } =
      this.props;
    return (
      <BooleanInput
        id={forID}
        value={value}
        label={label}
        status={status}
        description={description}
        inline={inline}
        onChange={onChange}
        error={error}
        errors={errors}
      />
    );
  }
}

BooleanControl.propTypes = {
  field: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  status: PropTypes.string,
  value: PropTypes.bool,
  inline: PropTypes.bool,
  error: PropTypes.bool,
  errors: PropTypes.array,
};

BooleanControl.defaultProps = {
  value: false,
};
