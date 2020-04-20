import React from 'react';
import { List } from 'immutable';
import { css } from '@emotion/core';
import { get } from 'lodash';
import { connect } from 'react-redux';
import { join } from 'path';
import { selectEntries } from '../../reducers/entries';
import ImmutablePropTypes from 'react-immutable-proptypes';
import reactSortableTreeStyles from 'react-sortable-tree/style.css';
import SortableTree, {
  getTreeFromFlatData,
  getVisibleNodeCount,
} from 'react-sortable-tree/dist/index.esm.js';

const rowContents = css`
  .rst__rowContents {
    min-width: 40px;
  }
`;

const getTreeData = (collection, entries) => {
  const parentKey = collection.get('nested');
  const rootKey = 'NETLIFY_CMS_ROOT_COLLECTION';
  const rootId = `NETLIFY_CMS_${collection.get('name').toUpperCase()}_ID`;
  const flatData = [
    { title: collection.get('label'), data: { parent: rootKey }, path: rootId },
    ...entries.toJS().map(e => ({ ...e, title: e.slug })),
  ];
  const treeData = getTreeFromFlatData({
    flatData,
    getKey: item => item.path,
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

class NestedCollection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    entries: ImmutablePropTypes.list.isRequired,
  };

  state = { treeData: [] };

  constructor(props) {
    super(props);
    this.state = {
      treeData: getTreeData(this.props.collection, this.props.entries),
    };
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.collection !== prevProps.collection ||
      this.props.entries !== prevProps.entries
    ) {
      const treeData = getTreeData(this.props.collection, this.props.entries);
      this.setState({ treeData });
    }
  }

  onChange = treeData => {
    this.setState({ treeData });
  };

  render() {
    const { treeData } = this.state;

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
          getNodeKey={({ node }) => node.path}
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

export default connect(mapStateToProps)(NestedCollection);
