import React, { PropTypes } from 'react';
import MarkupIt, { Syntax, BLOCKS, STYLES, ENTITIES } from 'markup-it';
import { omit } from 'lodash';
import registry from '../../lib/registry';

const defaultSchema = {
  [BLOCKS.DOCUMENT]: 'article',
  [BLOCKS.TEXT]: null,
  [BLOCKS.CODE]: ({ token }) => {
    const className = token.getIn(['data', 'syntax']) && `language-${ token.getIn(['data', 'syntax']) }`;
    return <pre><code className={className} dangerouslySetInnerHTML={{ __html: token.get('tokens').map(token => token.text).join('') }} /></pre>;
  },
  [BLOCKS.BLOCKQUOTE]: 'blockquote',
  [BLOCKS.PARAGRAPH]: 'p',
  [BLOCKS.FOOTNOTE]: 'footnote',
  [BLOCKS.HTML]: ({ token }) => <div dangerouslySetInnerHTML={{ __html: token.get('raw') }} />,
  [BLOCKS.HR]: 'hr',
  [BLOCKS.HEADING_1]: 'h1',
  [BLOCKS.HEADING_2]: 'h2',
  [BLOCKS.HEADING_3]: 'h3',
  [BLOCKS.HEADING_4]: 'h4',
  [BLOCKS.HEADING_5]: 'h5',
  [BLOCKS.HEADING_6]: 'h6',
  [BLOCKS.TABLE]: 'table',
  [BLOCKS.TABLE_ROW]: 'tr',
  [BLOCKS.TABLE_CELL]: 'td',
  [BLOCKS.OL_LIST]: 'ol',
  [BLOCKS.UL_LIST]: 'ul',
  [BLOCKS.LIST_ITEM]: 'li',

  [STYLES.TEXT]: null,
  [STYLES.BOLD]: 'strong',
  [STYLES.ITALIC]: 'em',
  [STYLES.CODE]: 'code',
  [STYLES.STRIKETHROUGH]: 'del',

  [ENTITIES.LINK]: 'a',
  [ENTITIES.IMAGE]: 'img',
  [ENTITIES.FOOTNOTE_REF]: 'sup',
  [ENTITIES.HARD_BREAK]: 'br',
};

const notAllowedAttributes = ['loose', 'image'];

export default class MarkupItReactRenderer extends React.Component {

  constructor(props) {
    super(props);
    const { syntax } = props;
    this.parser = new MarkupIt(syntax);
    this.plugins = {};
    registry.getEditorComponents().forEach((component) => {
      this.plugins[component.get('id')] = component;
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.syntax != this.props.syntax) {
      this.parser = new MarkupIt(nextProps.syntax);
    }
  }

  sanitizeProps(props) {
    const { getAsset } = this.props;

    if (props.image) {
      props = Object.assign({}, props, { src: getAsset(props.image).toString() });
    }

    return omit(props, notAllowedAttributes);
  }


  renderToken(schema, token, index = 0, key = '0') {
    const type = token.get('type');
    const data = token.get('data');
    const text = token.get('text');
    const tokens = token.get('tokens');
    const nodeType = schema[type];
    key = `${ key }.${ index }`;

    // Only render if type is registered as renderer
    if (typeof nodeType !== 'undefined') {
      let children = null;
      if (tokens.size) {
        children = tokens.map((token, idx) => this.renderToken(schema, token, idx, key));
      } else if (type === 'text') {
        children = text;
      }
      if (nodeType !== null) {
        let props = { key, token };
        if (typeof nodeType !== 'function') {
          props = { key, ...this.sanitizeProps(data.toJS()) };
        }
        // If this is a react element
        return React.createElement(nodeType, props, children);
      } else {
        // If this is a text node
        return children;
      }
    }

    const plugin = this.plugins[token.get('type')];
    if (plugin) {
      const output = plugin.toPreview(token.get('data').toJS());
      return typeof output === 'string' ?
        <span dangerouslySetInnerHTML={{ __html: output }} /> :
        output;
    }

    return null;
  }


  render() {
    const { value, schema, getAsset } = this.props;
    const content = this.parser.toContent(value);
    return this.renderToken({ ...defaultSchema, ...schema }, content.get('token'));
  }
}

MarkupItReactRenderer.propTypes = {
  value: PropTypes.string,
  syntax: PropTypes.instanceOf(Syntax).isRequired,
  schema: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ])),
  getAsset: PropTypes.func.isRequired,
};
