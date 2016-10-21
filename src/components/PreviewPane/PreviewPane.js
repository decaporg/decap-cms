import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ScrollSyncPane } from '../ScrollSync';
import registry from '../../lib/registry';
import { resolveWidget } from '../Widgets';
import Preview from './Preview';
import styles from './PreviewPane.css';

export default class PreviewPane extends React.Component {

  componentDidUpdate() {
    this.renderPreview();
  }

  widgetFor = (name) => {
    const { fields, entry, getMedia } = this.props;
    const field = fields.find(field => field.get('name') === name);
    const widget = resolveWidget(field.get('widget'));
    return React.createElement(widget.preview, {
      key: field.get('name'),
      value: entry.getIn(['data', field.get('name')]),
      field,
      getMedia,
    });
  };

  renderPreview() {
    const component = registry.getPreviewTemplate(this.props.collection.get('name')) || Preview;
    const previewProps = {
      ...this.props,
      widgetFor: this.widgetFor,
    };
    // We need to use this API in order to pass context to the iframe
    ReactDOM.unstable_renderSubtreeIntoContainer(
      this,
      <ScrollSyncPane attachTo={this.iframeBody}>
        {React.createElement(component, previewProps)}
      </ScrollSyncPane>
      , this.previewEl);
  }

  handleIframeRef = (ref) => {
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
      this.renderPreview();
    }
  };

  render() {
    const { collection } = this.props;
    if (!collection) {
      return null;
    }

    return <iframe className={styles.frame} ref={this.handleIframeRef} />;
  }
}

PreviewPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
  scrollTop: PropTypes.number,
  scrollHeight: PropTypes.number,
  offsetHeight: PropTypes.number,
};
