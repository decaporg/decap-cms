import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Map } from 'immutable';
import { partial } from 'lodash';
import ImmutablePropTypes from 'react-immutable-proptypes';
import c from 'classnames';
import { resolveWidget } from 'Lib/registry';
import EditorControl from 'Editor/EditorControlPane/EditorControl';

const TopBar = ({ collapsed, onCollapseToggle }) =>
  <div className="nc-listControl-topBar">
    <div className="nc-listControl-listCollapseToggle" onClick={onCollapseToggle}>
      <Icon type="caret" direction={collapsed ? 'up' : 'down'} size="small"/>
      {itemsCount} {listLabel}
    </div>
  </div>;


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
    className: PropTypes.string,
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

  controlFor(field) {
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

  render() {
    const { field, forID } = this.props;
    const multiFields = field.get('fields');
    const singleField = field.get('field');
    const className = this.props.className || '';

    if (multiFields) {
      return (<div id={forID} className={`${ className } nc-objectControl-root`}>
        {multiFields.map(f => this.controlFor(f))}
      </div>);
    } else if (singleField) {
      return this.controlFor(singleField);
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}
