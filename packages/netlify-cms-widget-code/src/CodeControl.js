import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames } from '@emotion/core';
import styled from '@emotion/styled';
import { Map } from 'immutable';
import { find, uniqBy, isEqual, capitalize, isObject } from 'lodash';
import uuid from 'uuid/v4';
import Resizable from 're-resizable';
import Select from 'react-select';
import { UnControlled as ReactCodeMirror } from 'react-codemirror2';
import CodeMirror from 'codemirror';
import isHotkey from 'is-hotkey';
import { Icon, buttons, colors, lengths, text, shadows } from 'netlify-cms-ui-default';
import languageSelectStyles from './languageSelectStyles';

const styleString = `
  padding: 0;
`;

const SettingsButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${shadows.drop};
  display: block;
  position: absolute;
  z-index: 100;
  right: 8px;
  top: 8px;
  opacity: 0.8;
  padding: 2px 4px;
  line-height: 1;
  height: auto;

  ${Icon} {
    position: relative;
    top: 1px;
  }
`;

const SettingsPaneContainer = styled.div`
  position: absolute;
  right: 0;
  width: 200px;
  z-index: 10;
  height: 100%;
  background-color: #fff;
  overflow-y: scroll;
  padding: 12px;
  ${shadows.drop};
`;

const SettingsPane = styled.div`
`;

const SettingsFieldLabel = styled.label`
  ${text.fieldLabel};
  font-size: 11px;
  display: block;
  margin-top: 8px;
  margin-bottom: 2px;
`;

const SettingsSectionTitle = styled.h3`
  font-size: 14px;
  margin-top: 14px;
  margin-bottom: 0;

  &:first-of-type {
    margin-top: 4px;
  }
`;

const defaultLang = { name: '', mode: '', label: 'None' };

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
    return { value: theme, label: capitalize(theme) };
  });
  return [{ value: '', label: 'Default' }, ...options];
}

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

  getLanguageByName = (name, languages = []) => {
    return languages.find(lang => lang.name === name);
  };

  getBaseLanguages = () => {
    const unknownLang = this.state?.unknownLang;
    return [
      defaultLang,
      unknownLang && { name: unknownLang, mode: unknownLang, label: `${unknownLang} (unknown)` },
    ].filter(v => v);
  };

  getAllLanguages = () => {
    const { widget } = this.props;
    if (widget.languages) {
      return widget.languages;
    }

    const mimeModes = CodeMirror?.mimeModes;
    if (mimeModes) {
      const languages = Object.keys(mimeModes).map(mimeType => ({
        name: mimeType.match(/^.+\/(?:x-)?(.+)$/)[1],
        mode: mimeType,
      }));
      return uniqBy(languages, 'name');
    }
    return [];
  }

  getKeyMapOptions = () => {
    return Object
      .keys(CodeMirror.keyMap)
      .filter(keyMap => ['default', 'emacs', 'sublime', 'vim'].includes(keyMap))
      .sort()
      .map(keyMap => ({ value: keyMap, label: capitalize(keyMap) }));
  }

  getLanguages = () => {
    const baseLanguages = this.getBaseLanguages();
    const allLanguages = this.getAllLanguages();
    const fieldLanguages = this.props.field.get('languages');
    if (!fieldLanguages) {
      return baseLanguages.concat(allLanguages);
    }
    const languages = fieldLanguages.map(lang => {
      if (Map.isMap(lang)) {
        return lang;
      }
      const langInfo = allLanguages.find(({ name, mode, label }) => {
        return [name, mode, label].includes(lang);
      });
      return langInfo || { name: lang, mode: lang };
    }).toJS();
    return baseLanguages.concat(languages);
  };

  // This widget is not fully controlled, it only takes a value through props
  // upon initialization.
  getInitialLang = () => {
    const { value, field } = this.props;
    const lang = (this.valueIsMap() && value && value.get(this.keys.lang)) || field.get('defaultLanguage');
    const langInfo = this.getLanguageByName(lang, this.getLanguages());
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

  handleChangeCodeMirrorProp(value, type) {
    const { onChange } = this.props;

    // Changing CodeMirror props requires re-initializing the
    // detached/uncontrolled React CodeMirror component, so here we save and
    // restore the selections and cursor position after the state change.
    const cursor = this.cm.doc.getCursor();
    const selections = this.cm.doc.listSelections();
    this.setState({
      [type]: value,
      codeMirrorKey: uuid(),
    }, () => {
      this.cm.doc.setCursor(cursor);
      this.cm.doc.setSelections(selections);
    });

    // Only persist the language change if supported - requires the value to be
    // a map rather than just a code string.
    if (type === 'lang' && this.valueIsMap()) {
      onChange(this.toValue('lang', value));
    }

    if (['theme', 'keyMap'].includes(type)) {
      localStorage.setItem(settingsPersistKeys[type], value);
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

  handleSettingsPaneKeyDown = event => {
    if (isHotkey('esc', event)) {
      this.hideSettings();
    }
  };

  render() {
    const { classNameWrapper, forID, widget } = this.props;
    const { lang, settingsVisible, keyMap, codeMirrorKey, theme } = this.state;
    const languages = this.getLanguages();
    const modeOptions = languages.map(valueToOption);
    const langInfo = this.getLanguageByName(lang, languages);

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
            {!settingsVisible && (
              <SettingsButton onClick={this.showSettings}>
                <Icon type="settings" size="small"/>
              </SettingsButton>
            )}
            {settingsVisible && (
              <SettingsPaneContainer onKeyDown={this.handleSettingsPaneKeyDown}>
                <SettingsPane>
                  <SettingsButton onClick={this.hideSettings}>
                    <Icon type="close" size="small"/>
                  </SettingsButton>
                  {this.allowLanguageSelection && (
                    <>
                      <SettingsSectionTitle>Field Settings</SettingsSectionTitle>
                      <SettingsFieldLabel htmlFor={`${forID}-select-mode`}>Mode</SettingsFieldLabel>
                      <Select
                        inputId={`${forID}-select-mode`}
                        styles={languageSelectStyles}
                        value={valueToOption(langInfo || defaultLang)}
                        options={modeOptions}
                        onChange={opt => this.handleChangeCodeMirrorProp(opt.value, 'lang')}
                        menuPlacement="auto"
                        captureMenuScroll={false}
                        autoFocus
                      />
                    </>
                  )}
                  {this.allowLanguageSelection && (
                    <>
                      <SettingsSectionTitle>Global Settings</SettingsSectionTitle>
                      {this.themes && (
                        <>
                          <SettingsFieldLabel htmlFor={`${forID}-select-theme`}>Theme</SettingsFieldLabel>
                          <Select
                            inputId={`${forID}-select-theme`}
                            styles={languageSelectStyles}
                            value={this.themes.find(thm => thm.value === theme)}
                            options={this.themes}
                            onChange={opt => this.handleChangeCodeMirrorProp(opt.value, 'theme')}
                            menuPlacement="auto"
                            captureMenuScroll={false}
                          />
                        </>
                      )}
                      <SettingsFieldLabel htmlFor={`${forID}-select-keymap`}>KeyMap</SettingsFieldLabel>
                      <Select
                        inputId={`${forID}-select-keymap`}
                        styles={languageSelectStyles}
                        value={valueToOption({ name: keyMap, label: capitalize(keyMap) })}
                        options={this.getKeyMapOptions()}
                        onChange={opt => this.handleChangeCodeMirrorProp(opt.value, 'keyMap')}
                        menuPlacement="auto"
                        captureMenuScroll={false}
                      />
                    </>
                  )}
                </SettingsPane>
              </SettingsPaneContainer>
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
