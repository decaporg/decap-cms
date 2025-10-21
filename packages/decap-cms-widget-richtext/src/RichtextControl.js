import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { List } from 'immutable';

import VisualEditor from './RichtextControl/VisualEditor';
import { EditorProvider } from './RichtextControl/editorContext';
import RawEditor from './RichtextControl/RawEditor';

const MODE_STORAGE_KEY = 'cms.md-mode';

export default class RichtextControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    editorControl: PropTypes.elementType.isRequired,
    value: PropTypes.string,
    field: ImmutablePropTypes.map.isRequired,
    getEditorComponents: PropTypes.func,
    t: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
  };
  constructor(props) {
    super(props);
    const preferredMode = localStorage.getItem(MODE_STORAGE_KEY) ?? 'rich_text';

    this.state = {
      mode:
        this.getAllowedModes().indexOf(preferredMode) !== -1
          ? preferredMode
          : this.getAllowedModes()[0],
      pendingFocus: false,
    };
  }

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(RichtextControl.propTypes, this.props, 'prop', 'RichtextControl');
  }

  handleMode = mode => {
    this.setState({ mode, pendingFocus: true });
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  setFocusReceived = () => {
    this.setState({ pendingFocus: false });
  };

  getAllowedModes = () => this.props.field.get('modes', List(['rich_text', 'raw'])).toArray();

  focus() {
    this.setState({ pendingFocus: true });
  }

  render() {
    const {
      classNameWrapper,
      field,
      t,
      isDisabled,
      getEditorComponents,
      editorControl,
      onChange,
      value,
    } = this.props;

    const isShowModeToggle = this.getAllowedModes().length > 1;
    const { mode, pendingFocus } = this.state;

    const visualEditor = (
      <EditorProvider editorControl={editorControl} editorComponents={getEditorComponents()}>
        <div className="cms-editor-visual" ref={this.processRef}>
          <VisualEditor
            t={t}
            field={field}
            className={classNameWrapper}
            getEditorComponents={getEditorComponents}
            isDisabled={isDisabled}
            onMode={this.handleMode}
            isShowModeToggle={isShowModeToggle}
            onChange={onChange}
            pendingFocus={pendingFocus && this.setFocusReceived}
            value={value}
          />
        </div>
      </EditorProvider>
    );

    const rawEditor = (
      <div className="cms-editor-raw" ref={this.processRef}>
        <RawEditor
          onChange={onChange}
          isShowModeToggle={isShowModeToggle}
          onMode={this.handleMode}
          className={classNameWrapper}
          value={value}
          field={field}
          pendingFocus={pendingFocus && this.setFocusReceived}
          t={t}
        />
      </div>
    );

    return mode === 'rich_text' ? visualEditor : rawEditor;
  }
}
