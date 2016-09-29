import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ControlPane from '../ControlPanel/ControlPane';
import PreviewPane from '../PreviewPane';
import styles from './EntryEditor.css';

export default class EntryEditor extends Component {

  state = {
    scrollTop: 0,
    scrollHeight: 0,
    offsetHeight: 0,
  }

  handleControlPaneScroll = evt => {
    const { scrollTop, scrollHeight, offsetHeight } = evt.target;
    this.setState({
      scrollTop,
      scrollHeight,
      offsetHeight,
    });
  }

  render() {
    const { collection, entry, getMedia, onChange, onAddMedia, onRemoveMedia, onPersist } = this.props;
    const { scrollTop, scrollHeight, offsetHeight } = this.state;

    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <div
            className={styles.controlPane}
            onScroll={this.handleControlPaneScroll}
          >
            <ControlPane
              collection={collection}
              entry={entry}
              getMedia={getMedia}
              onChange={onChange}
              onAddMedia={onAddMedia}
              onRemoveMedia={onRemoveMedia}
            />
          </div>
          <div className={styles.previewPane}>
            <PreviewPane
              collection={collection}
              entry={entry}
              getMedia={getMedia}
              scrollTop={scrollTop}
              scrollHeight={scrollHeight}
              offsetHeight={offsetHeight}
            />
          </div>
        </div>
        <div className={styles.footer}>
          <button onClick={onPersist}>Save</button>
        </div>
      </div>
    );
  }
}

EntryEditor.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
  onAddMedia: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onPersist: PropTypes.func.isRequired,
  onRemoveMedia: PropTypes.func.isRequired,
};
