import React, { PropTypes } from "react";
import unified from 'unified';
import markdown from 'remark-parse';
import rehype from 'remark-rehype';
import html from 'rehype-stringify';
import registry from "../../lib/registry";

export default class MarkupItReactRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.plugins = {};
    // TODO add back support for this.
    registry.getEditorComponents().forEach((component) => {
      this.plugins[component.get("id")] = component;
    });
  }

  render() {
    const doc = unified()
      .use(markdown, { commonmark: true, footnotes: true, pedantic: true })
      .use(rehype, { allowDangerousHTML: true })
      .use(html, { allowDangerousHTML: true })
      .processSync(this.props.value);
    return <div dangerouslySetInnerHTML={{ __html: doc }} />; // eslint-disable-line react/no-danger
  }
}

MarkupItReactRenderer.propTypes = {
  value: PropTypes.string,
};
