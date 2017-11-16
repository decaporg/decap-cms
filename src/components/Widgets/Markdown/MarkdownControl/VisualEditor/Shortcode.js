import React from 'react';
import c from 'classnames';
import { Map } from 'immutable';
import { connect } from 'react-redux';
import registry from '../../../../../lib/registry';
import { resolveWidget } from '../../../../Widgets';
import { openMediaLibrary, removeInsertedMedia } from '../../../../../actions/mediaLibrary';
import { addAsset } from '../../../../../actions/media';
import { getAsset } from '../../../../../reducers';

class Shortcode extends React.Component {
  handleChange = (field, value) => {
    const { editor, node } = this.props;
    editor.change(c => c.setNodeByKey(node.key, {
      data: {
        shortcode: field.get('name'),
        shortcodeData: node.data.set(field.get('name'), value),
      }
    }));
  };

  render() {
    const {
      attributes,
      node,
      editor,
      onAddAsset,
      boundGetAsset,
      mediaPaths,
      onOpenMediaLibrary,
      onRemoveInsertedMedia,
    } = this.props;
    const pluginId = node.data.get('shortcode');
    const shortcodeData = node.data.get('shortcodeData');
    const data = Map.isMap(shortcodeData) ? shortcodeData : Map(shortcodeData);
    const plugin = registry.getEditorComponents().get(pluginId);
    const isSelected = value.selection.hasFocusIn(node);
    const className = c('nc-visualEditor-shortcode', { ['nc-visualEditor-shortcodeSelected']: isSelected });
    return (
      <div {...attributes} className={className} draggable >
        {plugin.get('fields').map((field, index) => {
          const widget = resolveWidget(field.get('widget') || 'string');
          const value = data.get(field.get('name'));
          const key = `field-${ field.get('name') }`;
          const Control = widget.control;
          const controlProps = {
            field,
            value,
            onAddAsset,
            getAsset: boundGetAsset,
            onChange: val => this.handleChange(field, val),
            mediaPaths,
            onOpenMediaLibrary,
            onRemoveInsertedMedia,
          };

          return (
            <div className="nc-controlPane-control" key={key} onClick={e => e.stopPropagation()}>
              <label className="nc-controlPane-label" htmlFor={key}>{field.get('label')}</label>
              <Control {...controlProps}/>
            </div>
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { attributes, node, editor } = ownProps;
  return {
    mediaPaths: state.mediaLibrary.get('controlMedia'),
    boundGetAsset: getAsset.bind(null, state),
    attributes,
    node,
    editor,
  };
};

const mapDispatchToProps = {
  onAddAsset: addAsset,
  onOpenMediaLibrary: openMediaLibrary,
  onRemoveInsertedMedia: removeInsertedMedia,
};

export default connect(mapStateToProps, mapDispatchToProps)(Shortcode);
