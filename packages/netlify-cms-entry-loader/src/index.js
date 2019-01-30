import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { selectEntry } from 'netlify-cms-core/src/reducers';
import { loadEntry } from 'netlify-cms-core/src/actions/entries';

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
    const { entry: _e, collection, slug } = this.props;
    const entry = toJS(_e);
    const isCached = entry.data && !entry.isFetching;
    const isUpdate = entry.slug !== slug || entry.collection !== collection;
    if (!isUpdate && isCached) return;
    this.props.loadEntry(collection, slug);
  };
  render() {
    const { children, render = children } = this.props;
    const { isFetching, data = {}, error } = toJS(this.props.entry);
    return render({ isFetching, data, error });
  }
}

const mapStateToProps = (state, { collection, slug, entry }) => ({
  entry: entry ? { data: entry } : selectEntry(state, collection, slug),
  bypass: !!entry,
});

const getCollection = (collections, collection) =>
  typeof collection === 'string' ? collections.get(collection) : collection;

const mapDispatchToProps = {
  loadEntry: (collectionName, slug) => (dispatch, getState) => {
    const {collections, entries} = getState();
    const collection = getCollection(collections, collectionName);
    const isFetching = entries.getIn(['entities', `${collection}.${slug}`, 'isFetching']);
    return isFetching ? null : loadEntry(collection, slug)(dispatch, getState);
  },
};

const enhance = connect(
  mapStateToProps,
  mapDispatchToProps,
);

const EntryLoader = enhance(EntryLoaderComponent);

EntryLoader.propTypes = {
  collection: PropTypes.string,
  slug: PropTypes.string,
};

export default EntryLoader;
