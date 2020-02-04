import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import RawEditor from './RawEditor';
import VisualEditor from './VisualEditor';

const MODE_STORAGE_KEY = 'cms.md-mode';

// TODO: passing the editorControl and components like this is horrible, should
// be handled through Redux and a separate registry store for instances
let editorControl;
let _getEditorComponents = () => [];

export const getEditorControl = () => editorControl;
export const getEditorComponents = () => _getEditorComponents();

export default class MarkdownControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    editorControl: PropTypes.func.isRequired,
    value: PropTypes.string,
    field: ImmutablePropTypes.map.isRequired,
    getEditorComponents: PropTypes.func,
    t: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
  };

  constructor(props) {
    super(props);
    editorControl = props.editorControl;
    _getEditorComponents = props.getEditorComponents;
    this.state = {
      mode: localStorage.getItem(MODE_STORAGE_KEY) || 'visual',
      pendingFocus: false,
    };
  }

  handleMode = mode => {
    this.setState({ mode, pendingFocus: true });
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  processRef = ref => (this.ref = ref);

  setFocusReceived = () => {
    this.setState({ pendingFocus: false });
  };

  render() {
    const {
      onChange,
      onAddAsset,
      getAsset,
      value,
      classNameWrapper,
      field,
      getEditorComponents,
      resolveWidget,
      t,
    } = this.props;

    const { mode, pendingFocus } = this.state;
    const visualEditor = (
      <div className="cms-editor-visual" ref={this.processRef}>
        <VisualEditor
          onChange={onChange}
          onAddAsset={onAddAsset}
          onMode={this.handleMode}
          getAsset={getAsset}
          className={classNameWrapper}
          value={value}
          field={field}
          getEditorComponents={getEditorComponents}
          resolveWidget={resolveWidget}
          pendingFocus={pendingFocus && this.setFocusReceived}
          t={t}
        />
      </div>
    );
    const rawEditor = (
      <div className="cms-editor-raw" ref={this.processRef}>
        <RawEditor
          onChange={onChange}
          onAddAsset={onAddAsset}
          onMode={this.handleMode}
          getAsset={getAsset}
          className={classNameWrapper}
          value={value}
          field={field}
          pendingFocus={pendingFocus && this.setFocusReceived}
          t={t}
        />
      </div>
    );
    return mode === 'visual' ? visualEditor : rawEditor;
  }
}
