import React from 'react';
import PropTypes from 'prop-types';
import { List, fromJS } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { isString } from 'lodash';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

export default class MultiSelectControl extends React.Component {
  static propTypes = {
    classNameWrapper: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    field: ImmutablePropTypes.map.isRequired,
    value: ImmutablePropTypes.list.isRequired,
  };

  static defaultProps = {
    value: List(),
  };

  handleChange = value => {
    this.props.onChange(fromJS(value));
  };

  render() {
    const { value, field, classNameWrapper } = this.props;
    const valueArray = typeof value === 'string' ? value.split(',') : value.toJS();
    const options = field.get('options', List())
      .map(opt => isString(opt) ? { label: opt, value: opt } : opt)
      .toJS();
    return (
      <Select
        name={field.get('name')}
        className={classNameWrapper}
        value={valueArray}
        onChange={this.handleChange}
        multi={true}
        options={options}
      />
    );
  }
}
