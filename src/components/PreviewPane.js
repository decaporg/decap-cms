import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import registry from '../lib/registry';
import { resolveWidget } from './Widgets';
import styles from './PreviewPane.css';

class Preview extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    entry: ImmutablePropTypes.map.isRequired,
    getMedia: PropTypes.func.isRequired,
  };

  previewFor(field) {
    const { entry, getMedia } = this.props;
    const widget = resolveWidget(field.get('widget'));
    return React.createElement(widget.preview, {
      field: field,
      value: entry.getIn(['data', field.get('name')]),
      getMedia: getMedia,
    });
  }

  render() {
    const { collection } = this.props;
    if (!collection) { return null; }

    return <div>
      {collection.get('fields').map((field) => <div key={field.get('name')}>{this.previewFor(field)}</div>)}
    </div>;
  }
}

export default class PreviewPane extends React.Component {
  componentDidUpdate() {
    this.renderPreview();
  }

  widgetFor = name => {
    const { collection, entry, getMedia } = this.props;
    const field  = collection.get('fields').find((field) => field.get('name') === name);
    const widget = resolveWidget(field.get('widget'));
    return React.createElement(widget.preview, {
      field: field,
      value: entry.getIn(['data', field.get('name')]),
      getMedia: getMedia,
    });
  };

  renderPreview() {
    const props = Object.assign({}, this.props, { widgetFor: this.widgetFor });
    const component = registry.getPreviewTemplate(props.collection.get('name')) || Preview;

    render(React.createElement(component, props), this.previewEl);
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
      ref.contentDocument.body.appendChild(this.previewEl);
      this.renderPreview();
    }
  };

  render() {
    const { collection } = this.props;
    if (!collection) { return null; }

    return <iframe className={styles.frame} ref={this.handleIframeRef}></iframe>;
  }
}

PreviewPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
};
