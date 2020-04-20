import React from 'react';
import { List } from 'immutable';
import { css } from '@emotion/core';
import { get, set } from 'lodash';
import { connect } from 'react-redux';
import { join } from 'path';
import { persistEntries } from '../../actions/entries';
import { selectEntries } from '../../reducers/entries';
import ImmutablePropTypes from 'react-immutable-proptypes';
import reactSortableTreeStyles from 'react-sortable-tree/style.css';
import SortableTree, {
  getTreeFromFlatData,
  getVisibleNodeCount,
  getFlatDataFromTree,
} from 'react-sortable-tree/dist/index.esm.js';

const rowContents = css`
  .rst__rowContents {
    min-width: 40px;
  }
`;

const getRootId = collection => `NETLIFY_CMS_${collection.get('name').toUpperCase()}_ID`;
const getKey = node => node.path;

const getTreeData = (collection, entries) => {
  const parentKey = collection.get('nested');
  const rootKey = 'NETLIFY_CMS_ROOT_COLLECTION';
  const rootId = getRootId(collection);
  const flatData = [
    { title: collection.get('label'), data: { parent: rootKey }, path: rootId, expanded: true },
    ...entries.toJS().map(e => ({ ...e, title: e.slug })),
  ];
  const treeData = getTreeFromFlatData({
    flatData,
    getKey,
    getParentKey: item => {
      const parent = get(item, ['data', parentKey]);
      if (parent) {
        return join(parent);
      }
      return rootId;
    },
    rootKey,
  });
  return treeData;
};

const getEntriesData = (collection, treeData) => {
  const parentKey = collection.get('nested');
  return (
    getFlatDataFromTree({ treeData, getNodeKey: getKey })
      .filter(({ parentNode }) => parentNode)
      // eslint-disable-next-line no-unused-vars
      .map(({ node: { title, children, ...rest }, parentNode: { path: parent } }) => {
        const newNode = rest;
        return set(newNode, ['data', parentKey], parent);
      })
  );
};

class NestedCollection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    entries: ImmutablePropTypes.list.isRequired,
  };

  constructor(props) {
    super(props);
  }

  onChange = treeData => {
    const { collection, persistEntries } = this.props;
    const entriesData = getEntriesData(collection, treeData);
    persistEntries(this.props.collection, entriesData);
  };

  render() {
    const { collection, entries } = this.props;

    const treeData = getTreeData(collection, entries);

    const rowHeight = 40;
    const height = getVisibleNodeCount({ treeData }) * rowHeight;
    return (
      <div
        css={css`
          ${reactSortableTreeStyles}
          height: ${height}px;
          ${rowContents}
        `}
      >
        <SortableTree
          treeData={treeData}
          rowHeight={rowHeight}
          onChange={this.onChange}
          getNodeKey={({ node }) => getKey(node)}
          canDrag={({ node }) => node.path !== treeData[0].path}
          canDrop={({ nextParent }) => nextParent !== null}
          isVirtualized={false}
        />
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collection } = ownProps;
  const entries = selectEntries(state.entries, collection.get('name')) || List();
  return { entries };
}

const mapDispatchToProps = {
  persistEntries,
};

export default connect(mapStateToProps, mapDispatchToProps)(NestedCollection);
