import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ControlPane from './ControlPane';
import PreviewPane from './PreviewPane';
import styles from './EntryEditor.css';

export default class EntryEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.calculateHeight();
    window.addEventListener('resize', this.handleResize, false);
  }

  componengWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    this.calculateHeight();
  }

  calculateHeight() {
    const height = window.innerHeight - 54;
    console.log('setting height to %s', height);
    this.setState({height});
  }

  render() {
    const { collection, entry, getMedia, onChange, onAddMedia, onRemoveMedia, onPersist } = this.props;
    const {height} = this.state;

    return <div className={styles.entryEditor} style={{height}}>
      <div className={styles.container}>
        <div className={styles.controlPane}>
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
          <PreviewPane collection={collection} entry={entry} getMedia={getMedia} />
        </div>
      </div>
      <div className={styles.footer}>
        <button onClick={onPersist}>Save</button>
      </div>
    </div>;
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
