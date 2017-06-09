import React, { PropTypes } from 'react';
import MarkupIt from 'markup-it';
import markdownSyntax from 'markup-it/syntaxes/markdown';
import htmlSyntax from 'markup-it/syntaxes/html';
import CaretPosition from 'textarea-caret-position';
import TextareaAutosize from 'react-textarea-autosize';
import registry from '../../../../lib/registry';
import { createAssetProxy } from '../../../../valueObjects/AssetProxy';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../UI/Sticky/Sticky';
import styles from './index.css';

const HAS_LINE_BREAK = /\n/m;

const markdown = new MarkupIt(markdownSyntax);
const html = new MarkupIt(htmlSyntax);

function processUrl(url) {
  if (url.match(/^(https?:\/\/|mailto:|\/)/)) {
    return url;
  }
  if (url.match(/^[^/]+\.[^/]+/)) {
    return `https://${ url }`;
  }
  return `/${ url }`;
}

function cleanupPaste(paste) {
  const content = html.toContent(paste);
  return markdown.toText(content);
}

function getCleanPaste(e) {
  const transfer = e.clipboardData;
  return new Promise((resolve) => {
    const isHTML = !!Array.from(transfer.types).find(type => type === 'text/html');

    if (isHTML) {
      const data = transfer.getData('text/html');
      // Avoid trying to clean up full HTML documents with head/body/etc
      if (!data.match(/^\s*<!doctype/i)) {
        e.preventDefault();
        resolve(cleanupPaste(data));
      } else {
        // Handle complex pastes by stealing focus with a contenteditable div
        const div = document.createElement('div');
        div.contentEditable = true;
        div.setAttribute(
          'style', 'opacity: 0; overflow: hidden; width: 1px; height: 1px; position: fixed; top: 50%; left: 0;'
        );
        document.body.appendChild(div);
        div.focus();
        setTimeout(() => {
          resolve(cleanupPaste(div.innerHTML));
          document.body.removeChild(div);
        }, 50);
        return null;
      }
    }

    e.preventDefault();
    return resolve(transfer.getData(transfer.types[0]));
  });
}

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    const plugins = registry.getEditorComponents();
    this.state = { plugins };
    this.shortcuts = {
      meta: {
        b: this.handleBold,
        i: this.handleItalic,
      },
    };
  }

  componentDidMount() {
    this.updateHeight();
    this.element.addEventListener('paste', this.handlePaste, false);
  }

  componentDidUpdate() {
    if (this.newSelection) {
      this.element.selectionStart = this.newSelection.start;
      this.element.selectionEnd = this.newSelection.end;
      this.newSelection = null;
    }
  }

  componentWillUnmount() {
    this.element.removeEventListener('paste', this.handlePaste);
  }

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
    const value = this.props.value || '';
    const selection = this.getSelection();
    const newSelection = Object.assign({}, selection);
    const beforeSelection = value.substr(0, selection.start);
    const afterSelection = value.substr(selection.end);
    newSelection.end = selection.start + chars.length;
    this.newSelection = newSelection;
    this.props.onChange(beforeSelection + chars + afterSelection);
  }

  toggleHeader(header) {
    const value = this.props.value || '';
    const selection = this.getSelection();
    const newSelection = Object.assign({}, selection);
    const lastNewline = value.lastIndexOf('\n', selection.start);
    const currentMatch = value.substr(lastNewline + 1).match(/^(#+)\s/);
    const beforeHeader = value.substr(0, lastNewline + 1);
    let afterHeader;
    let chars;
    if (currentMatch) {
      afterHeader = value.substr(lastNewline + 1 + currentMatch[0].length);
      chars = currentMatch[1] === header ? '' : `${ header } `;
      const diff = chars.length - currentMatch[0].length;
      newSelection.start += diff;
      newSelection.end += diff;
    } else {
      afterHeader = value.substr(lastNewline + 1);
      chars = `${ header } `;
      newSelection.start += header.length + 1;
      newSelection.end += header.length + 1;
    }
    this.newSelection = newSelection;
    this.props.onChange(beforeHeader + chars + afterHeader);
  }

  updateHeight() {
    if (this.element.scrollHeight > this.element.clientHeight) {
      this.element.style.height = `${ this.element.scrollHeight }px`;
    }
  }

  handleRef = (ref) => {
    this.element = ref;
    if (ref) {
      this.caretPosition = new CaretPosition(ref);
    }
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
    const url = prompt('URL:'); // eslint-disable-line no-alert
    const selection = this.getSelection();
    this.replaceSelection(`[${ selection.selected }](${ processUrl(url) })`);
  };

  handleSelection = () => {
    const value = this.props.value || '';
    const selection = this.getSelection();
    if (selection.start !== selection.end && !HAS_LINE_BREAK.test(selection.selected)) {
      try {
        const selectionPosition = this.caretPosition.get(selection.start, selection.end);
        this.setState({ selectionPosition });
      } catch (e) {
        console.log(e); // eslint-disable-line no-console
      }
    } else if (selection.start === selection.end) {
      const newBlock =
        (
          (selection.start === 0 && value.substr(0, 1).match(/^\n?$/)) ||
          value.substr(selection.start - 2, 2) === '\n\n') &&
        (
          selection.end === (value.length - 1) ||
          value.substr(selection.end, 2) === '\n\n' ||
          value.substr(selection.end).match(/\n*$/m)
        );

      if (newBlock) {
        const position = this.caretPosition.get(selection.start, selection.end);
        this.setState({ selectionPosition: position });
      }
    }
  };

  handleChange = (e) => {
    this.props.onChange(e.target.value);
    this.updateHeight();
  };

  handlePluginSubmit = (plugin, data) => {
    const toBlock = plugin.get('toBlock');
    this.replaceSelection(toBlock.call(toBlock, data.toJS()));
  };

  handleHeader(header) {
    return () => {
      this.toggleHeader(header);
    };
  }

  handleDragEnter = (e) => {
    e.preventDefault();
    this.setState({ dragging: true });
  };

  handleDragLeave = (e) => {
    e.preventDefault();
    this.setState({ dragging: false });
  };

  handleDragOver = (e) => {
    e.preventDefault();
  };

  handleDrop = (e) => {
    e.preventDefault();

    this.setState({ dragging: false });

    let data;

    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      data = Array.from(e.dataTransfer.files).map((file) => {
        const link = `[Uploading ${ file.name }...]()`;
        if (file.type.split('/')[0] === 'image') {
          return `!${ link }`;
        }

        createAssetProxy(file.name, file)
        .then((assetProxy) => {
          this.props.onAddAsset(assetProxy);
          // TODO: Change the link text
        });
        return link;
      }).join('\n\n');
    } else {
      data = e.dataTransfer.getData('text/plain');
    }
    this.replaceSelection(data);
  };

  handlePaste = (e) => {
    const { value, onChange } = this.props;
    const selection = this.getSelection();
    const beforeSelection = value.substr(0, selection.start);
    const afterSelection = value.substr(selection.end);

    getCleanPaste(e).then((paste) => {
      const newSelection = Object.assign({}, selection);
      newSelection.start = newSelection.end = beforeSelection.length + paste.length;
      this.newSelection = newSelection;
      onChange(beforeSelection + paste + afterSelection);
    });
  };

  handleToggle = () => {
    this.props.onMode('visual');
  };

  render() {
    const { onAddAsset, onRemoveAsset, getAsset } = this.props;
    const { plugins, selectionPosition, dragging } = this.state;
    const classNames = [styles.root];
    if (dragging) {
      classNames.push(styles.dragging);
    }

    return (<div
      className={classNames.join(' ')}
      onDragEnter={this.handleDragEnter}
      onDragLeave={this.handleDragLeave}
      onDragOver={this.handleDragOver}
      onDrop={this.handleDrop}
    >
      <Sticky
        className={styles.editorControlBar}
        classNameActive={styles.editorControlBarSticky}
        fillContainerWidth
      >
        <Toolbar
          selectionPosition={selectionPosition}
          onH1={this.handleHeader('#')}
          onH2={this.handleHeader('##')}
          onBold={this.handleBold}
          onItalic={this.handleItalic}
          onLink={this.handleLink}
          onToggleMode={this.handleToggle}
          plugins={plugins}
          onSubmit={this.handlePluginSubmit}
          onAddAsset={onAddAsset}
          onRemoveAsset={onRemoveAsset}
          getAsset={getAsset}
          rawMode
        />
      </Sticky>
      <TextareaAutosize
        className={styles.textarea}
        inputRef={this.handleRef}
        className={styles.textarea}
        value={this.props.value || ''}
        onKeyDown={this.handleKey}
        onChange={this.handleChange}
        onSelect={this.handleSelection}
      />
      <div className={styles.shim} />
    </div>);
  }
}

RawEditor.propTypes = {
  onAddAsset: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  getAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  value: PropTypes.node,
};
