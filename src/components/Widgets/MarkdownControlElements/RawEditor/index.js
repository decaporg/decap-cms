import React, { PropTypes } from 'react';
import { fromJS } from 'immutable';
import CaretPosition from 'textarea-caret-position';
import registry from '../../../../lib/registry';
import MediaProxy from '../../../../valueObjects/MediaProxy';
import Toolbar from './Toolbar';
import BlockMenu from './BlockMenu';
import styles from './index.css';

const HAS_LINE_BREAK = /\n/m;

function processUrl(url) {
  if (url.match(/^(https?:\/\/|mailto:|\/)/)) {
    return url;
  }
  if (url.match(/^[^\/]+\.[^\/]+/)) {
    return `https://${ url }`;
  }
  return `/${ url }`;
}

function preventDefault(e) {
  e.preventDefault();
}

const buildtInPlugins = fromJS([{
  label: 'Image',
  id: 'image',
  fromBlock: (data) => {
    const m = data.match(/^!\[([^\]]+)\]\(([^\)]+)\)$/);
    return m && {
      image: m[2],
      alt: m[1],
    };
  },
  toBlock: data => `![${ data.alt }](${ data.image })`,
  toPreview: data => `<img src="${ data.image }" alt="${ data.alt }" />`,
  pattern: /^!\[([^\]]+)\]\(([^\)]+)\)$/,
  fields: [{
    label: 'Image',
    name: 'image',
    widget: 'image',
  }, {
    label: 'Alt Text',
    name: 'alt',
  }],
}]);

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    const plugins = registry.getEditorComponents();
    this.state = {
      plugins: buildtInPlugins.concat(plugins),
    };
    this.shortcuts = {
      meta: {
        b: this.handleBold,
      },
    };
  }
  componentDidMount() {
    this.updateHeight();
    this.element.addEventListener('dragenter', preventDefault, false);
    this.element.addEventListener('dragover', preventDefault, false);
    this.element.addEventListener('drop', this.handleDrop, false);
  }

  componentDidUpdate() {
    if (this.newSelection) {
      this.element.selectionStart = this.newSelection.start;
      this.element.selectionEnd = this.newSelection.end;
      this.newSelection = null;
    }
  }

  componentWillUnmount() {
    this.element.removeEventListener('dragenter', preventDefault);
    this.element.removeEventListener('dragover', preventDefault);
    this.element.removeEventListener('drop', this.handleDrop);
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
    const { value } = this.props;
    const selection = this.getSelection();
    const newSelection = Object.assign({}, selection);
    const beforeSelection = value.substr(0, selection.start);
    const afterSelection = value.substr(selection.end);
    newSelection.end = selection.start + chars.length;
    this.newSelection = newSelection;
    this.props.onChange(beforeSelection + chars + afterSelection);
  }

  toggleHeader(header) {
    const { value } = this.props;
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
    const url = prompt('URL:');
    const selection = this.getSelection();
    this.replaceSelection(`[${ selection.selected }](${ processUrl(url) })`);
  };

  handleSelection = () => {
    const { value } = this.props;
    const selection = this.getSelection();
    if (selection.start !== selection.end && !HAS_LINE_BREAK.test(selection.selected)) {
      try {
        const position = this.caretPosition.get(selection.start, selection.end);
        this.setState({ showToolbar: true, showBlockMenu: false, selectionPosition: position });
      } catch (e) {
        this.setState({ showToolbar: false, showBlockMenu: false });
      }
    } else if (selection.start === selection.end) {
      const newBlock =
        (
          (selection.start === 0 && value.substr(0,1).match(/^\n?$/)) ||
          value.substr(selection.start - 2, 2) === '\n\n') &&
        (
          selection.end === (value.length - 1) ||
          value.substr(selection.end, 2) === '\n\n' ||
          value.substr(selection.end).match(/\n*$/m)
        );

      if (newBlock) {
        const position = this.caretPosition.get(selection.start, selection.end);
        this.setState({ showToolbar: false, showBlockMenu: true, selectionPosition: position });
      } else {
        this.setState({ showToolbar: false, showBlockMenu: false });
      }
    } else {
      this.setState({ showToolbar: false, showBlockMenu: false });
    }
  };

  handleChange = (e) => {
    this.props.onChange(e.target.value);
    this.updateHeight();
  };

  handleBlock = (chars) => {
    this.replaceSelection(chars);
    this.setState({ showBlockMenu: false });
  };

  handleHeader(header) {
    return () => {
      this.toggleHeader(header);
    };
  }

  handleDrop = (e) => {
    e.preventDefault();
    let data;

    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      data = Array.from(e.dataTransfer.files).map((file) => {
        const mediaProxy = new MediaProxy(file.name, file);
        this.props.onAddMedia(mediaProxy);
        const link = `[${ file.name }](${ mediaProxy.public_path })`;
        if (file.type.split('/')[0] === 'image') {
          return `!${ link }`;
        }
        return link;
      }).join('\n\n');
    } else {
      data = e.dataTransfer.getData('text/plain');
    }
    this.replaceSelection(data);
  };

  render() {
    const { onAddMedia, onRemoveMedia, getMedia } = this.props;
    const { showToolbar, showBlockMenu, plugins, selectionPosition } = this.state;
    return (<div className={styles.root}>
      <Toolbar
        isOpen={showToolbar}
        selectionPosition={selectionPosition}
        onH1={this.handleHeader('#')}
        onH2={this.handleHeader('##')}
        onBold={this.handleBold}
        onItalic={this.handleItalic}
        onLink={this.handleLink}
      />
      <BlockMenu
        isOpen={showBlockMenu}
        selectionPosition={selectionPosition}
        plugins={plugins}
        onBlock={this.handleBlock}
        onAddMedia={onAddMedia}
        onRemoveMedia={onRemoveMedia}
        getMedia={getMedia}
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
  onAddMedia: PropTypes.func.isRequired,
  onRemoveMedia: PropTypes.func.isRequired,
  getMedia: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
};
