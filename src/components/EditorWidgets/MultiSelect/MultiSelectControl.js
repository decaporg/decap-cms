import PropTypes from 'prop-types';
import React from 'react';
import { List, Map } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import isString from 'lodash/isString';
import isEqual from 'lodash/isEqual';

export default class MultiSelectControl extends React.Component {
  static propTypes = {
    classNameWrapper: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    value: ImmutablePropTypes.list,
    field: PropTypes.node,
  };

  constructor(props) {
    super(props);
    const { field, value } = this.props;
    const val = (value || List());

    const fieldOptions = field.get('options', List());
    this.options = List([
      ...fieldOptions.map((option) => {
        if (isString(option)) {
          return { label: option, value: option };
        }
        return isMap(option) ? option.toJS() : option;
      }),
    ]);

    // We need to be able to reconstruct the list in exactly the same
    // order every time, to prevent superfluous changes. We do so by
    // mapping over this.options in this.handleChange and checking
    // this this.optionIndicesToggled to determine whether to include
    // the value. Constructing the map at the beginning and tracking
    // changes to it allows us to run the potentially-expensive
    // equality checks in val.some only when creating the widget,
    // instead of on every change.
    this.optionIndicesToggled = Map(this.options.map(
       (option, i) => [i, val.some(v => isEqual(v, option.value))]
    ));
  }

  render() {
    const { classNameWrapper, field, value } = this.props;
    const val = value || List();

    if (this.options.length === 0) {
      return <div>Error rendering select control for {field.get('name')}: No options</div>;
    }

    const selectedLabels = this.options.reduce(
      (list, option, i) => (this.optionIndicesToggled.get(i) ? list.push(option.label) : list),
      List(),
    );

    return (
      <div className={`nc-multiSelectControl ${ classNameWrapper }`}>
        <div className="nc-multiSelectControl-container">{ selectedLabels }</div>
        <ul className="mc-multiSelectControl-options">
          { this.options.map((option, i) => <li key={i}>
            <label>
              <input
                type="checkbox"
                value={option.label}
                checked={val.includes(option.value)}
                onChange={this.handleChange(i)}
              />
              { option.label }
            </label>
          </li>) }
        </ul>
      </div>
    );
  }

  handleChange = (toggledI) => () => {
    const { onChange } = this.props;
    const oldOptionState = this.optionIndicesToggled.get(toggledI);
    this.optionIndicesToggled = this.optionIndicesToggled.set(toggledI, !oldOptionState);

    onChange(this.options.reduce(
      (list, option, i) => (this.optionIndicesToggled.get(i) ? list.push(option.value) : list),
      List(),
    ));
  };
}
