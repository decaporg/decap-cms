import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map } from 'immutable';
import { partial } from 'lodash';
import c from 'classnames';
import { resolveWidget } from 'Lib/registry';
import { Icon } from 'UI';
import EditorControl from 'Editor/EditorControlPane/EditorControl';

const TopBar = ({ collapsed, onCollapseToggle }) => (
  <div className="nc-objectControl-topBar">
    <div className="nc-objectControl-objectCollapseToggle">
      <button className="nc-listControl-listCollapseToggleButton" onClick={onCollapseToggle}>
        <Icon type="chevron" direction={collapsed ? 'right' : 'down'} size="small" />
      </button>
    </div>
  </div>
);

export default class ObjectControl extends Component {
  static propTypes = {
    onChangeObject: PropTypes.func.isRequired,
    onOpenMediaLibrary: PropTypes.func.isRequired,
    mediaPaths: ImmutablePropTypes.map.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveInsertedMedia: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.object,
      PropTypes.bool,
    ]),
    field: PropTypes.object,
    forID: PropTypes.string,
    classNameWrapper: PropTypes.string.isRequired,
    forList: PropTypes.bool,
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
    const {
      onAddAsset,
      onOpenMediaLibrary,
      mediaPaths,
      onRemoveInsertedMedia,
      getAsset,
      value,
      onChangeObject,
    } = this.props;

    if (field.get('widget') === 'hidden') {
      return null;
    }
    const widgetName = field.get('widget') || 'string';
    const widget = resolveWidget(widgetName);
    const fieldName = field.get('name');
    const fieldValue = value && Map.isMap(value) ? value.get(fieldName) : value;

    return (
      <EditorControl
        key={key}
        field={field}
        value={fieldValue}
        mediaPaths={mediaPaths}
        getAsset={getAsset}
        onChange={onChangeObject}
        onOpenMediaLibrary={onOpenMediaLibrary}
        onAddAsset={onAddAsset}
        onRemoveInsertedMedia={onRemoveInsertedMedia}
      />
    );
  }

  handleCollapseToggle = () => {
    this.setState({ collapsed: !this.state.collapsed });
  }

  render() {
    const { field, forID, classNameWrapper, forList } = this.props;
    const { collapsed } = this.state;
    const multiFields = field.get('fields');
    const singleField = field.get('field');

    if (multiFields) {
      return (
        <div id={forID} className={c(classNameWrapper, 'nc-objectControl-root')}>
          { forList ? null : <TopBar collapsed={collapsed} onCollapseToggle={this.handleCollapseToggle} /> }
          { collapsed ? null : multiFields.map((f, idx) => this.controlFor(f, idx)) }
        </div>
      );
    } else if (singleField) {
      return this.controlFor(singleField);
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}
