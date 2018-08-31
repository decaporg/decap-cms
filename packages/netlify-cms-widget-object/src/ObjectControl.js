import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'react-emotion';
import { Map } from 'immutable';
import { ObjectWidgetTopBar, components } from 'netlify-cms-ui-default';

const styles = {
  nestedObjectControl: css`
    padding: 6px 14px 14px;
    border-top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  `,
};

export default class ObjectControl extends Component {
  static propTypes = {
    onChangeObject: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.node, PropTypes.object, PropTypes.bool]),
    field: PropTypes.object,
    forID: PropTypes.string,
    classNameWrapper: PropTypes.string.isRequired,
    forList: PropTypes.bool,
    editorControl: PropTypes.func.isRequired,
    resolveWidget: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: Map(),
  };

  constructor(props) {
    super(props);
    this.state = {
      collapsed: false,
    };
  }

  /*
   * Always update so that each nested widget has the option to update. This is
   * required because ControlHOC provides a default `shouldComponentUpdate`
   * which only updates if the value changes, but every widget must be allowed
   * to override this.
   */
  shouldComponentUpdate() {
    return true;
  }

  controlFor(field, key) {
    const { value, onChangeObject, editorControl: EditorControl } = this.props;

    if (field.get('widget') === 'hidden') {
      return null;
    }
    const fieldName = field.get('name');
    const fieldValue = value && Map.isMap(value) ? value.get(fieldName) : value;

    return <EditorControl key={key} field={field} value={fieldValue} onChange={onChangeObject} />;
  }

  handleCollapseToggle = () => {
    this.setState({ collapsed: !this.state.collapsed });
  };

  renderFields = (multiFields, singleField) => {
    if (multiFields) {
      return multiFields.map((f, idx) => this.controlFor(f, idx));
    }
    return this.controlFor(singleField);
  };

  render() {
    const { field, forID, classNameWrapper, forList } = this.props;
    const { collapsed } = this.state;
    const multiFields = field.get('fields');
    const singleField = field.get('field');

    if (multiFields || singleField) {
      return (
        <div
          id={forID}
          className={cx(classNameWrapper, components.objectWidgetTopBarContainer, {
            [styles.nestedObjectControl]: forList,
          })}
        >
          {forList ? null : (
            <ObjectWidgetTopBar
              collapsed={collapsed}
              onCollapseToggle={this.handleCollapseToggle}
            />
          )}
          {collapsed ? null : this.renderFields(multiFields, singleField)}
        </div>
      );
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}
