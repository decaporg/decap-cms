import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames } from '@emotion/core';
import styled from '@emotion/styled';
import { Map } from 'immutable';
import { find, uniq, uniqBy, isEqual, isObject, sortBy, isEmpty } from 'lodash';
import uuid from 'uuid/v4';
import Resizable from 're-resizable';
import { UnControlled as ReactCodeMirror } from 'react-codemirror2';
import CodeMirror from 'codemirror';
import SettingsPane from './SettingsPane';
import SettingsButton from './SettingsButton';
import languageData from '../../data/languages-processed.json';

// TODO: relocate as a utility function
function getChangedProps(previous, next, keys) {
  const propNames = keys || uniq(Object.keys(previous), Object.keys(next));
  const changedProps = propNames.reduce((acc, prop) => {
    if (previous[prop] !== next[prop]) {
      acc[prop] = next[prop];
    }
    return acc;
  }, {});
  if (!isEmpty(changedProps)) {
    return changedProps;
  }
}

const languages = languageData.map(lang => ({
  label: lang.label,
  name: lang.identifiers[0],
  mode: lang.codemirror_mime_type || lang.codemirror_mode,
}));

const styleString = `
  padding: 0;
`;

const defaultLang = { name: '', mode: '', label: 'none' };

function valueToOption(val) {
  if (typeof val === 'string') {
    return { value: val, label: val };
  }
  return { value: val.name, label: val.label || val.name }
}

function themesToOptions(themes = []) {
  const options = themes.map(theme => {
    if (isObject(theme)) {
      return valueToOption(theme);
    }
    return { value: theme, label: theme };
  });
  return [{ value: '', label: 'default' }, ...options];
}

const modes = languages.map(valueToOption);

const settingsPersistKeys = {
  theme: 'cms.codemirror.theme',
  keyMap: 'cms.codemirror.keymap',
};

export default class CodeControl extends React.Component {
  static propTypes = {
    field: ImmutablePropTypes.map.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
    forID: PropTypes.string.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    widget: PropTypes.object.isRequired,
  };

  keys = this.getKeys(this.props.field);

  state = {
    unknownLang: null,
    lang: '',
    keyMap: localStorage.getItem(settingsPersistKeys['keyMap'])
      || this.props.widget.codeMirrorConfig?.keyMap
      || 'default',
    settingsVisible: false,
    codeMirrorKey: uuid(),
    theme: localStorage.getItem(settingsPersistKeys['theme'])
      || this.props.widget.codeMirrorConfig?.theme
      || '',
  };

  lastKnownValue = this.valueIsMap() ? this.props.value?.get(this.keys.code) : this.props.value;

  themes = themesToOptions(this.props.field.get('themes') || this.props.widget.themes);

  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(this.state, nextState);
  }

  componentDidMount() {
    this.setState({
      lang: this.getInitialLang() || '',
    });
  }

  componentDidUpdate(prevProps, prevState) {
    this.updateCodeMirrorProps(prevState);
  }

  updateCodeMirrorProps(prevState) {
    const keys = ['lang', 'theme', 'keyMap'];
    const changedProps = getChangedProps(prevState, this.state, keys);
    if (changedProps) {
      this.handleChangeCodeMirrorProps(changedProps);
    }
  }

  getLanguageByName = name => {
    return languages.find(lang => lang.name === name);
  };

  getKeyMapOptions = () => {
    return Object
      .keys(CodeMirror.keyMap)
      .sort()
      .map(keyMap => ({ value: keyMap, label: keyMap }));
  }

  // This widget is not fully controlled, it only takes a value through props
  // upon initialization.
  getInitialLang = () => {
    const { value, field } = this.props;
    const lang = (this.valueIsMap() && value && value.get(this.keys.lang)) || field.get('defaultLanguage');
    const langInfo = this.getLanguageByName(lang)
    if (lang && !langInfo) {
      this.setState({ unknownLang: lang });
    }
    return lang;
  };

  // If `allow_language_selection` is not set, default to true. Otherwise, use
  // its value.
  allowLanguageSelection =
    !this.props.field.has('allow_language_selection') ||
    !!this.props.field.get('allow_language_selection');

  toValue = this.valueIsMap()
    ? (type, value) => (this.props.value || Map()).set(this.keys[type], value)
    : (type, value) => (type === 'code') ? value : this.props.value;

  // If the value is a map, keys can be customized via config.
  getKeys(field) {
    const defaults = {
      code: 'code',
      lang: 'lang',
    };

    // Force default keys if widget is an editor component code block.
    if (this.props.isEditorComponent) {
      return defaults;
    }

    const keys = field.get('keys', Map()).toJS();
    return { ...defaults, ...keys };
  }

  // Determine if the persisted value is a map rather than a plain string. A map
  // value allows both the code string and the language to be persisted.
  valueIsMap() {
    const { field, isEditorComponent } = this.props;
    return !field.get('output_code_only') || !isEditorComponent;
  }

  handleChangeCodeMirrorProps(changedProps) {
    const { onChange } = this.props;

    // Changing CodeMirror props requires re-initializing the
    // detached/uncontrolled React CodeMirror component, so here we save and
    // restore the selections and cursor position after the state change.
    const cursor = this.cm.doc.getCursor();
    const selections = this.cm.doc.listSelections();
    this.setState({ codeMirrorKey: uuid() }, () => {
      this.cm.doc.setCursor(cursor);
      this.cm.doc.setSelections(selections);
    });

    for (const key of ['theme', 'keyMap']) {
      if (changedProps[key]) {
        localStorage.setItem(settingsPersistKeys[key], changedProps[key]);
      }
    }

    // Only persist the language change if supported - requires the value to be
    // a map rather than just a code string.
    if (changedProps.lang && this.valueIsMap()) {
      onChange(this.toValue('lang', changedProps.lang));
    }
  }

  handleChange(newValue) {
    this.lastKnownValue = newValue;
    this.props.onChange(this.toValue('code', newValue));
  }

  showSettings = () => {
    this.setState({ settingsVisible: true });
  }

  hideSettings = () => {
    if (this.state.settingsVisible) {
      this.setState({ settingsVisible: false });
    }
    this.cm.focus();
  }

  render() {
    const { classNameWrapper, forID, widget } = this.props;
    const { lang, settingsVisible, keyMap, codeMirrorKey, theme } = this.state;
    const langInfo = this.getLanguageByName(lang);

    return (
      <ClassNames>
        {({ css, cx }) => (
          <Resizable
            defaultSize={{ height: 300 }}
            minHeight={130}
            enable={{
              top: false,
              right: false,
              bottom: true,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false,
            }}
            className={cx(
              classNameWrapper,
              css`
                ${styleString}
              `,
            )}
          >
            {!settingsVisible && <SettingsButton onClick={this.showSettings}/>}
            {settingsVisible && (
              <SettingsPane
                hideSettings={this.hideSettings}
                forID={forID}
                modes={modes}
                mode={valueToOption(langInfo || defaultLang)}
                theme={this.themes.find(t => t.value === theme)}
                themes={this.themes}
                keyMap={{ value: keyMap, label: keyMap }}
                keyMaps={this.getKeyMapOptions()}
                allowLanguageSelection={this.allowLanguageSelection}
                onChangeLang={newLang => this.setState({ lang: newLang })}
                onChangeTheme={newTheme => this.setState({ lang: newTheme })}
                onChangeKeyMap={newKeyMap => this.setState({ lang: newKeyMap })}
              />
            )}
            <ReactCodeMirror
              key={codeMirrorKey}
              id={forID}
              className={css`
                height: 100%;

                & > .CodeMirror {
                  height: 100%;
                  cursor: text;
                }
              `}
              options={{
                lineNumbers: true,
                autofocus: true,
                ...widget.codeMirrorConfig,
                extraKeys: {
                  'Shift-Tab': 'indentLess',
                  'Tab': 'indentMore',
                  ...(widget.codeMirrorConfig.extraKeys || {}),
                },
                theme,
                mode: langInfo?.mode,
                keyMap,
              }}
              detach={true}
              editorDidMount={cm => {
                this.cm = cm;
              }}
              value={this.lastKnownValue}
              onChange={(editor, data, newValue) => this.handleChange(newValue)}
              onFocus={this.hideSettings}
            />
          </Resizable>
        )}
      </ClassNames>
    );
  }
}
