import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';

import VisualEditor from './RichtextControl/VisualEditor';
import { EditorProvider } from './RichtextControl/editorContext';

export default class MarkdownControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    editorControl: PropTypes.elementType.isRequired,
    value: PropTypes.string,
    field: ImmutablePropTypes.map.isRequired,
    getEditorComponents: PropTypes.func,
    t: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
  };


  render() {
    const { classNameWrapper, field, t, isDisabled, getEditorComponents, editorControl, onChange, value } =
      this.props;

    const visualEditor = (
      <EditorProvider editorControl={editorControl} editorComponents={getEditorComponents()}>
        <div className="cms-editor-visual" ref={this.processRef}>
          <VisualEditor
            t={t}
            field={field}
            className={classNameWrapper}
            getEditorComponents={getEditorComponents}
            isDisabled={isDisabled}
            onChange={onChange}
            value={value}
          />
        </div>
      </EditorProvider>
    );
    return visualEditor;
  }
}
