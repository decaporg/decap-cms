import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';

import VisualEditor from './RichtextControl/VisualEditor';

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
    const { classNameWrapper, field, t, isDisabled, onChange, value } = this.props;
    const visualEditor = (
      <div className="cms-editor-visual" ref={this.processRef}>
        <VisualEditor
          t={t}
          field={field}
          className={classNameWrapper}
          isDisabled={isDisabled}
          onChange={onChange}
          value={value}
        />
      </div>
    );
    return visualEditor;
  }
}
