import React, { PropTypes } from "react";
import Remark from "remark";
import toHAST from "mdast-util-to-hast";
import hastToHTML from "hast-util-to-html";
import registry from "../../lib/registry";

// Setup Remark.
const remark = new Remark({
  commonmark: true,
  footnotes: true,
  pedantic: true,
});

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
    const { value } = this.props;
    const mdast = remark.parse(value);
    const hast = toHAST(mdast, { allowDangerousHTML: true });
    const html = hastToHTML(hast, { allowDangerousHTML: true });
    return <div dangerouslySetInnerHTML={{ __html: html }} />; // eslint-disable-line react/no-danger
  }
}

MarkupItReactRenderer.propTypes = {
  value: PropTypes.string,
};
