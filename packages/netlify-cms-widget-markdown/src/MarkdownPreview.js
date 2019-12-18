import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';
import { markdownToHtml } from './serializers';

class MarkdownPreview extends React.Component {
  static propTypes = {
    getAsset: PropTypes.func.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    value: PropTypes.string,
  };

  subscribed = true;

  state = {
    html: null,
  };

  async _renderHtml() {
    const { value, getAsset, resolveWidget } = this.props;
    if (value) {
      const html = await markdownToHtml(value, { getAsset, resolveWidget });
      if (this.subscribed) {
        this.setState({ html });
      }
    }
  }

  componentDidMount() {
    this._renderHtml();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value || prevProps.getAsset !== this.props.getAsset) {
      this._renderHtml();
    }
  }

  componentWillUnmount() {
    this.subscribed = false;
  }

  render() {
    const { html } = this.state;

    if (html === null) {
      return null;
    }

    return <WidgetPreviewContainer dangerouslySetInnerHTML={{ __html: html }} />;
  }
}

export default MarkdownPreview;
