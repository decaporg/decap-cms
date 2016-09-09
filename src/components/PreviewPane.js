import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Widgets from './Widgets';

class Preview extends React.Component {
  previewFor(field) {
    const { entry, getMedia } = this.props;
    const widget = Widgets[field.get('widget')] || Widgets._unknown;
    return React.createElement(widget.Preview, {
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
  constructor(props) {
    super(props);
    this.handleIframeRef = this.handleIframeRef.bind(this);
  }

  componentDidUpdate() {
    this.renderPreview();
  }

  renderPreview() {
    const props = this.props;
    render(<Preview {...props}/>, this.previewEl);
  }

  handleIframeRef(ref) {
    if (ref) {
      this.previewEl = document.createElement('div');
      ref.contentDocument.body.appendChild(this.previewEl);
      this.renderPreview();
    }
  }

  render() {
    const { collection } = this.props;
    if (!collection) { return null; }

    return <iframe style={{width: "100%", height: "100%", border: "none"}} ref={this.handleIframeRef}></iframe>
  }
}

PreviewPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
};
