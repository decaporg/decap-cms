import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

const selectEntry = (state, collection, slug) => state.getIn(['entities', `${collection}.${slug}`]);

const toJS = object => {
  if (typeof object.toJS === 'function') return object.toJS();
  return object;
};

class EntryLoaderComponent extends React.Component {
  static propTypes = {
    loadEntry: PropTypes.func,
    collection: PropTypes.string,
    slug: PropTypes.string,
    entry: PropTypes.shape({
      isFetching: PropTypes.bool,
      error: PropTypes.string,
      data: PropTypes.object,
      collection: PropTypes.string,
      slug: PropTypes.string,
    }).isRequired,
    bypass: PropTypes.bool,
    children: PropTypes.func,
    render: PropTypes.func,
  };
  static defaultProps = { entry: {}, bypass: false };
  componentDidMount() {
    this.fetch();
  }
  componentDidUpdate() {
    this.fetch();
  }
  shouldComponentUpdate(nextProps) {
    if (this.props.collection !== nextProps.collection) return true;
    if (this.props.slug !== nextProps.slug) return true;
    if (this.props.entry !== nextProps.entry) return true;
    return false;
  }
  fetch = () => {
    if (this.props.bypass) return;
    const { entry: _e, loadEntry, collection, slug } = this.props;
    const entry = toJS(_e);
    const isCached = entry.data && !entry.isFetching;
    const isUpdate = entry.slug !== slug || entry.collection !== collection;
    if (!isUpdate && isCached) return;
    loadEntry(collection, slug);
  };
  render() {
    const { children, render = children } = this.props;
    const { isFetching, data, error } = toJS(this.props.entry);
    return render({ ...data, isFetching, error });
  }
}

const mapStateToProps = ({ entries }, { collection, slug, entry }) => ({
  entry: entry ? { data: entry } : selectEntry(entries, collection, slug),
  bypass: !!entry,
});

const EntryLoader = connect(mapStateToProps)(EntryLoaderComponent);

EntryLoader.propTypes = {
  collection: PropTypes.string,
  slug: PropTypes.string,
};

export default EntryLoader;
