import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import registry from '../../lib/registry';
import { resolveWidget } from '../Widgets';
import Preview from './Preview';
import styles from './PreviewPane.css';

export default class PreviewPane extends React.Component {

  componentDidUpdate(prevProps) {
    // Update scroll position of the iframe
    const { scrollTop, scrollHeight, offsetHeight, ...rest } = this.props;
    const frameHeight = this.iframeBody.scrollHeight - offsetHeight;
    this.iframeBody.scrollTop = frameHeight * scrollTop / (scrollHeight - offsetHeight);

    // We don't want to re-render on scroll
    if (prevProps.collection !== this.props.collection || prevProps.entry !== this.props.entry) {
      this.renderPreview(rest);
    }
  }

  widgetFor = name => {
    const { collection, entry, getMedia } = this.props;
    const field = collection.get('fields').find((field) => field.get('name') === name);
    const widget = resolveWidget(field.get('widget'));
    return React.createElement(widget.preview, {
      key: field.get('name'),
      value: entry.getIn(['data', field.get('name')]),
      field,
      getMedia,
    });
  }

  renderPreview(props) {
    const component = registry.getPreviewTemplate(props.collection.get('name')) || Preview;
    const previewProps = {
      ...props,
      widgetFor: this.widgetFor
    };
    render(React.createElement(component, previewProps), this.previewEl);
  }

  handleIframeRef = ref => {
    if (ref) {
      registry.getPreviewStyles().forEach((style) => {
        const linkEl = document.createElement('link');
        linkEl.setAttribute('rel', 'stylesheet');
        linkEl.setAttribute('href', style);
        ref.contentDocument.head.appendChild(linkEl);
      });
      this.previewEl = document.createElement('div');
      this.iframeBody = ref.contentDocument.body;
      this.iframeBody.appendChild(this.previewEl);
      this.renderPreview(this.props);
    }
  }

  render() {
    const { collection } = this.props;
    if (!collection) {
      return null;
    }

    return <iframe className={styles.frame} ref={this.handleIframeRef}></iframe>;
  }
}

PreviewPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
  scrollTop: PropTypes.number,
  scrollHeight: PropTypes.number,
  offsetHeight: PropTypes.number,
};
