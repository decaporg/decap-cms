import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames } from '@emotion/core';
import { Map } from 'immutable';
import { find } from 'lodash';
import Resizable from 're-resizable';
import Select from 'react-select';
import { UnControlled as ReactCodeMirror } from 'react-codemirror2';
import isHotkey from 'is-hotkey';
import languageSelectStyles from './languageSelectStyles';

const styleString = `
  height: 100%;
  padding: 0;
  overflow: hidden;
  cursor: text;

  & > .CodeMirror {
    // Enforce border radius on CodeMirror's absolute positioned gutter
    z-index: 0;
    position: relative;
    height: 100%;
  }
`;

const languages = [
  { name: '', mode: '', label: 'None' },
  { name: 'c', mode: 'text/x-csrc', label: 'C' },
  { name: 'cpp', mode: 'text/x-c++src', label: 'C++' },
  { name: 'java', mode: 'text/x-java', label: 'Java' },
  { name: 'objectivec', mode: 'text/x-objectivec', label: 'Objective-C' },
  { name: 'scala', mode: 'text/x-scala', label: 'Scala' },
  { name: 'kotlin', mode: 'text/x-kotlin', label: 'Kotlin' },
  { name: 'css', mode: 'text/css', label: 'CSS' },
  { name: 'scss', mode: 'text/x-scss', label: 'SCSS' },
  { name: 'less', mode: 'text/x-less', label: 'Less' },
  { name: 'html', mode: 'htmlmixed', label: 'HTML' },
  { name: 'javascript', mode: 'javascript', label: 'JavaScript' },
];

const defaultLanguage = languages[0];

export default class CodeControl extends React.Component {
  static propTypes = {
    field: ImmutablePropTypes.map.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
    forID: PropTypes.string.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    widget: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const { value, field } = props;
    const lang = (this.valueIsMap() && value && value.get(this.keys.lang)) || field.get('lang');
  }

  keys = this.getKeys(this.props.field);

  state = {
    lang: defaultLanguage,
    value: this.valueIsMap()
      ? this.props.value && this.props.value.get(this.keys.code)
      : this.props.value,
  }

  theme = this.props.field.get('theme') || '';

  languageOptions = languages.map(({ name, label }) => ({ value: name, label }));
  allowLanguageSelection =
    !this.props.field.has('allow_language_selection') ||
    !!this.props.field.get('allow_language_selection');

  toValue = this.valueIsMap()
    ? (type, value) => (this.props.value || Map()).set(this.keys[type], value)
    : (type, value) => (type === 'code') ? value : this.props.value;

  getKeys(field) {
    return {
      code: 'code',
      lang: 'lang',

      // force default keys if widget is an editor component code block
      ...(this.props.isEditorComponent ? {} : field.get('keys', Map()).toJS()),
    };
  }

  valueIsMap() {
    const { field, isEditorComponent } = this.props;
    return !field.get('output_code_only') || !isEditorComponent;
  }

  handleChangeLang(lang) {
    const { onChange } = this.props;
    const cursor = this.cm.doc.getCursor();
    const selections = this.cm.doc.listSelections();
    this.setState({
      lang: find(languages, { name: lang }),
    }, () => {
      this.cm.doc.setCursor(cursor);
      this.cm.doc.setSelections(selections);
      this.cm.focus();
    });
    if (this.valueIsMap()) {
      onChange(this.toValue('lang', lang));
    }
  }

  handleChange(newValue) {
    this.props.onChange(this.toValue('code', newValue));
    this.setState({ value: newValue });
  }

  render() {
    const { classNameWrapper, forID, widget } = this.props;
    const { allowLanguageSelection } = this;
    const { lang, value } = this.state;

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
          >
            {allowLanguageSelection && (
              <Select
                styles={languageSelectStyles}
                value={{ value: lang.name, label: lang.label }}
                options={this.languageOptions}
                onChange={opt => this.handleChangeLang(opt.value)}
              />
            )}
            <ReactCodeMirror
              key={lang.name}
              id={forID}
              className={cx(
                classNameWrapper,
                css`
                  ${styleString}
                `,
              )}
              options={{
                lineNumbers: true,
                mode: lang.mode,
                autofocus: true,
                extraKeys: {
                  'Shift-Tab': 'indentLess',
                  'Tab': 'indentMore',
                },
                ...widget.codeMirrorConfig,
              }}
              detach={true}
              editorDidMount={cm => { this.cm = cm }}
              value={value}
              onChange={(editor, data, newValue) => this.handleChange(newValue)}
            />
          </Resizable>
        )}
      </ClassNames>
    );
  }
}
