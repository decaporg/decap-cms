import React, { PropTypes } from 'react';
import Toolbar from './Toolbar';

function processUrl(url) {
  if (url.match(/^(https?:\/\/|mailto:|\/)/)) {
    return url;
  }
  if (url.match(/^[^\/]+\.[^\/]+/)) {
    return `https://${ url }`;
  }
  return `/${ url }`;
}

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.shortcuts = {
      meta: {
        b: this.handleBold,
      },
    };
  }
  componentDidMount() {
    this.updateHeight();
  }

  componentDidUpdate() {
    if (this.newSelection) {
      this.element.selectionStart = this.newSelection.start;
      this.element.selectionEnd = this.newSelection.end;
      this.newSelection = null;
    }
  }

  handleChange = (e) => {
    this.props.onChange(e.target.value);
    this.updateHeight();
  };

  updateHeight() {
    if (this.element.scrollHeight > this.element.clientHeight) {
      this.element.style.height = `${ this.element.scrollHeight }px`;
    }
  }

  handleRef = (ref) => {
    this.element = ref;
  };

  handleToolbarRef = (ref) => {
    this.toolbar = ref;
  };

  handleKey = (e) => {
    if (e.metaKey) {
      const action = this.shortcuts.meta[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    }
  };

  handleBold = () => {
    this.surroundSelection('**');
  };

  handleItalic = () => {
    this.surroundSelection('*');
  };

  handleLink = () => {
    const url = prompt('URL:');
    const selection = this.getSelection();
    this.replaceSelection(`[${ selection.selected }](${ processUrl(url) })`);
  };

  handleSelection = () => {
    const selection = this.getSelection();
    this.setState({ showToolbar: selection.start !== selection.end });
  };

  getSelection() {
    const start = this.element.selectionStart;
    const end = this.element.selectionEnd;
    const selected = (this.props.value || '').substr(start, end - start);
    return { start, end, selected };
  }

  surroundSelection(chars) {
    const selection = this.getSelection();
    const newSelection = Object.assign({}, selection);
    const { value } = this.props;
    const escapedChars = chars.replace(/\*/g, '\\*');
    const regexp = new RegExp(`^${ escapedChars }.*${ escapedChars }$`);
    let changed = chars + selection.selected + chars;

    if (regexp.test(selection.selected)) {
      changed = selection.selected.substr(chars.length, selection.selected.length - (chars.length * 2));
      newSelection.end = selection.end - (chars.length * 2);
    } else if (
      value.substr(selection.start - chars.length, chars.length) === chars &&
      value.substr(selection.end, chars.length) === chars
    ) {
      newSelection.start = selection.start - chars.length;
      newSelection.end = selection.end + chars.length;
      changed = selection.selected;
    } else {
      newSelection.end = selection.end + (chars.length * 2);
    }

    const beforeSelection = value.substr(0, selection.start);
    const afterSelection = value.substr(selection.end);

    this.newSelection = newSelection;
    this.props.onChange(beforeSelection + changed + afterSelection);
  }

  replaceSelection(chars) {
    const { value } = this.props;
    const selection = this.getSelection();
    const newSelection = Object.assign({}, selection);
    const beforeSelection = value.substr(0, selection.start);
    const afterSelection = value.substr(selection.end);
    newSelection.end = selection.start + chars.length;
    this.newSelection = newSelection;
    this.props.onChange(beforeSelection + chars + afterSelection);
  }

  render() {
    const { showToolbar } = this.state;
    return (<div>
      <Toolbar
        ref={this.handleToolbarRef}
        isOpen={showToolbar}
        onBold={this.handleBold}
        onItalic={this.handleItalic}
        onLink={this.handleLink}
      />
      <textarea
        ref={this.handleRef}
        value={this.props.value || ''}
        onKeyDown={this.handleKey}
        onChange={this.handleChange}
        onSelect={this.handleSelection}
      />
    </div>);
  }
}

RawEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
};
