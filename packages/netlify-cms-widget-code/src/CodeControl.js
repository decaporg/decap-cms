import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames } from '@emotion/core';
import { Map } from 'immutable';
import { find } from 'lodash';
import Resizable from 're-resizable';
import Select from 'react-select';
import CodeMirror from 'codemirror';
import { Controlled as ReactCodeMirror } from 'react-codemirror2';
import codeMirrorStyles from 'codemirror/lib/codemirror.css';
import codeMirrorTheme from 'codemirror/theme/material.css';
import { lengths } from 'netlify-cms-ui-default';
import languageSelectStyles from './languageSelectStyles';

const styleString = `
  ${codeMirrorStyles};
  ${codeMirrorTheme};

  height: 100%;
  padding: 0;
  overflow: hidden;

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
  };

  constructor(props) {
    super(props);
    const { field } = props;
    this.keys = this.getKeys(field);
    this.languageOptions = languages.map(({ name, label }) => ({ value: name, label }));
    this.allowLanguageSelection = !field.has('allow_language_selection') ||
      !!field.get('allow_language_selection');
    const lang = (this.valueIsMap() && props.value && props.value.get(this.keys.lang)) || field.get('lang');
    this.state = { lang: find(languages, { name: lang }) || defaultLanguage };
    if (this.valueIsMap()) {
      this.getCode = () => {
        return this.props.value && this.props.value.get(this.keys.code);
      }
      this.toValue = (type, value) => (this.props.value || Map()).set(this.keys[type], value);
    } else {
      this.getCode = () => this.props.value;
      this.toValue = (type, value) => type === 'code' ? value : this.props.value;
    }
  }

  getKeys(field) {
    return {
      code: 'code',
      lang: 'lang',

      // force default keys if widget is an editor component code block
      ...(this.props.editorComponentType === 'code-block' ? {} : field.get('keys', Map()).toJS()),
    };
  }

  valueIsMap() {
    const { field, editorComponentType } = this.props;
    return !field.get('output_code_only') || editorComponentType !== 'code-block';
  }

  handleChangeLang(lang) {
    const { onChange } = this.props;
    const callback = this.valueIsMap() ? () => onChange(this.toValue('lang', lang)) : undefined;
    this.setState({ lang: find(languages, { name: lang }) }, callback);
  }

  render() {
    const { value, onChange, field, classNameWrapper, forID, editorComponentType } = this.props;
    const { keys, allowLanguageSelection } = this;
    const { lang } = this.state;

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
            {allowLanguageSelection &&
              <Select
                styles={languageSelectStyles}
                value={{ value: lang.name, label: lang.label }}
                options={this.languageOptions}
                onChange={opt => this.handleChangeLang(opt.value)}
              />
            }
            <ReactCodeMirror
              id={forID}
              editorDidMount={() => console.log(CodeMirror.modes) || console.log(CodeMirror.mimeModes)}
              className={cx(classNameWrapper, css`${styleString}`)}
              options={{
                theme: 'material',
                lineNumbers: true,
                autofocus: true,
                mode: lang.mode,
              }}
              value={this.getCode() || ''}
              onBeforeChange={(editor, data, newValue) => onChange(this.toValue('code', newValue))}
            />
          </Resizable>
        )}
      </ClassNames>
    );
  }
};
