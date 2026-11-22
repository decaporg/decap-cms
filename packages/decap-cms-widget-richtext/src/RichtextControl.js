import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { List } from 'immutable';
import trimEnd from 'lodash/trimEnd';

import VisualEditor from './RichtextControl/VisualEditor';
import { EditorProvider } from './RichtextControl/editorContext';
import RawEditor from './RichtextControl/RawEditor';

const MODE_STORAGE_KEY = 'cms.md-mode';

export default class RichtextControl extends React.Component {
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

  static defaultProps = {
    value: '',
  };
  constructor(props) {
    super(props);
    const preferredMode = localStorage.getItem(MODE_STORAGE_KEY) ?? 'rich_text';

    this.state = {
      mode:
        // When used inside a container/shortcode editor component, default to
        // rich text mode — the widget type already implies the editing surface.
        props.isEditorComponent
          ? 'rich_text'
          : this.getAllowedModes().indexOf(preferredMode) !== -1
          ? preferredMode
          : this.getAllowedModes()[0],
      pendingFocus: false,
    };
  }

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(RichtextControl.propTypes, this.props, 'prop', 'RichtextControl');

    // Ensure containerised widgets start in the correct mode even if the
    // constructor ran before the prop was available (e.g. HMR / late prop).
    if (this.props.isEditorComponent && this.state.mode !== 'rich_text') {
      this.setState({ mode: 'rich_text' });
    }
  }

  handleMode = mode => {
    this.setState({ mode, pendingFocus: true });
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  // The serializer trims trailing whitespace, while a saved file ends with a newline
  // (see `entryToRaw`), so the stored value can be "text\n" while the editor reports "text".
  // Keep the stored value's trailing whitespace on output that has none of its own, so that
  // loading an entry, or undoing an edit, gives back the saved value instead of marking the
  // entry as having unsaved changes.
  handleChange = newValue => {
    const { onChange } = this.props;
    const value = this.props.value ?? '';
    const trailing = value.slice(trimEnd(value).length);
    const nextValue = newValue && trimEnd(newValue) === newValue ? newValue + trailing : newValue;
    if (nextValue !== value) {
      onChange(nextValue);
    }
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
      onAddAsset,
      getAsset,
      value,
    } = this.props;

    const isEditorComponent = this.props.isEditorComponent;
    const isShowModeToggle = this.getAllowedModes().length > 1 && !isEditorComponent;
    const { mode, pendingFocus } = this.state;

    const visualEditor = (
      <EditorProvider editorControl={editorControl} editorComponents={getEditorComponents()}>
        <div className="cms-editor-visual">
          <VisualEditor
            t={t}
            field={field}
            className={classNameWrapper}
            getEditorComponents={getEditorComponents}
            isDisabled={isDisabled}
            isEditorComponent={isEditorComponent}
            onMode={this.handleMode}
            isShowModeToggle={isShowModeToggle}
            onChange={this.handleChange}
            onAddAsset={onAddAsset}
            getAsset={getAsset}
            pendingFocus={pendingFocus && this.setFocusReceived}
            value={value}
          />
        </div>
      </EditorProvider>
    );

    const rawEditor = (
      <div className="cms-editor-raw">
        <RawEditor
          onChange={this.handleChange}
          onAddAsset={onAddAsset}
          getAsset={getAsset}
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
