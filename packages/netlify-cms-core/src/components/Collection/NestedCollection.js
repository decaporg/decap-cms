import React from 'react';
import PropTypes from 'prop-types';
import { List } from 'immutable';
import { css } from '@emotion/core';
import { connect } from 'react-redux';
import { dirname, sep } from 'path';
import { moveEntries } from '../../actions/entries';
import { selectEntryCollectionTitle } from '../../reducers/collections';
import { selectEntries } from '../../reducers/entries';
import ImmutablePropTypes from 'react-immutable-proptypes';
import reactSortableTreeStyles from 'react-sortable-tree/style.css';
import SortableTree, {
  getTreeFromFlatData,
  getFlatDataFromTree,
  getVisibleNodeCount,
  changeNodeAtPath,
} from 'react-sortable-tree/dist/index.esm.js';

const rowContents = css`
  .rst__rowContents {
    min-width: 40px;
  }
`;

const getKey = node => node.path;
const getNodeKey = ({ node }) => getKey(node);

const getTreeData = (collection, entries, expanded = {}) => {
  const rootKey = 'NETLIFY_CMS_ROOT_COLLECTION';
  const rootFolder = collection.get('folder');
  const entriesObj = entries.toJS();

  const dirs = entriesObj.reduce((acc, entry) => {
    let dir = dirname(entry.path);
    while (!acc[dir] && dir && dir !== rootFolder) {
      const parts = dir.split(sep);
      acc[dir] = parts.pop();
      dir = parts.length && parts.join(sep);
    }
    return acc;
  }, {});

  if (collection.getIn(['nested', 'summary'])) {
    collection = collection.set('summary', collection.getIn(['nested', 'summary']));
  } else {
    collection = collection.delete('summary');
  }

  const flatData = [
    {
      title: collection.get('label'),
      path: rootFolder,
      isDir: true,
      expanded: expanded[rootFolder],
    },
    ...Object.entries(dirs).map(([key, value]) => ({
      title: value,
      path: key,
      isDir: true,
      expanded: expanded[key],
    })),
    ...entriesObj.map((e, index) => {
      const entryMap = entries.get(index);
      const title = selectEntryCollectionTitle(collection, entryMap);
      return {
        ...e,
        title,
        isDir: false,
        expanded: expanded[e.path],
      };
    }),
  ];

  const treeData = getTreeFromFlatData({
    flatData,
    getKey,
    getParentKey: item => {
      if (item.path === rootFolder) {
        return rootKey;
      }
      return dirname(item.path);
    },
    rootKey,
  });
  return treeData;
};

class NestedCollection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    entries: ImmutablePropTypes.list.isRequired,
    moveEntries: PropTypes.func.isRequired,
  };

  state = { treeData: [] };

  constructor(props) {
    super(props);
    this.state = {
      treeData: getTreeData(this.props.collection, this.props.entries),
    };
  }

  componentDidUpdate(prevProps) {
    const { collection, entries } = this.props;
    if (collection !== prevProps.collection || entries !== prevProps.entries) {
      const flatData = getFlatDataFromTree({
        treeData: this.state.treeData,
        getNodeKey,
        ignoreCollapsed: true,
      });

      const expanded = flatData.reduce((acc, { node }) => {
        acc[node.path] = node.expanded;
        return acc;
      }, {});
      const treeData = getTreeData(collection, entries, expanded);

      this.setState({ treeData });
    }
  }

  onChange = () => {
    // do nothing as we handle state in onVisibilityToggle and onMoveNode
  };

  onVisibilityToggle = ({ node, expanded, path }) => {
    const { treeData } = this.state;
    this.setState({
      treeData: changeNodeAtPath({
        treeData,
        getNodeKey,
        path,
        newNode: { ...node, expanded },
        ignoreCollapsed: false,
      }),
    });
  };

  onMoveNode = ({ node, nextParentNode }) => {
    const from = node.path;
    const to = nextParentNode.path;
    this.props.moveEntries(this.props.collection, from, to);
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
          onVisibilityToggle={this.onVisibilityToggle}
          onMoveNode={this.onMoveNode}
          getNodeKey={getNodeKey}
          canDrag={({ node }) => node.path !== treeData[0].path}
          canDrop={({ nextParent }) => nextParent !== null && nextParent.isDir}
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
  moveEntries,
};

export default connect(mapStateToProps, mapDispatchToProps)(NestedCollection);
