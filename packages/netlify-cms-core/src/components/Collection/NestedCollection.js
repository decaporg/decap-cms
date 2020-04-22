import React from 'react';
import { List } from 'immutable';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { dirname, sep } from 'path';
import { addFileTemplateFields } from '../../lib/formatters';
import { selectEntryCollectionTitle } from '../../reducers/collections';
import { selectEntries } from '../../reducers/entries';
import { Icon, colors } from 'netlify-cms-ui-default';
import ImmutablePropTypes from 'react-immutable-proptypes';
import reactSortableTreeStyles from 'react-sortable-tree/style.css';
import SortableTree, {
  getTreeFromFlatData,
  getFlatDataFromTree,
  getVisibleNodeCount,
} from 'react-sortable-tree/dist/index.esm.js';

const rowContents = css`
  .rst__rowContents {
    min-width: 40px;
  }
`;

const getKey = node => node.path;
const getNodeKey = ({ node }) => getKey(node);

const TreeNavLink = styled(NavLink)`
  display: flex;
  font-size: 14px;
  font-weight: 500;
  align-items: center;
  border-left: 2px solid #fff;

  ${Icon} {
    margin-right: 8px;
  }

  ${props => css`
    &:hover,
    &:active,
    &.${props.activeClassName} {
      color: ${colors.active};
      background-color: ${colors.activeBackground};
      border-left-color: #4863c6;
    }
  `};
`;

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
      let entryMap = entries.get(index);
      entryMap = entryMap.set(
        'data',
        addFileTemplateFields(entryMap.get('path'), entryMap.get('data')),
      );
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

  onChange = treeData => {
    this.setState({ treeData });
  };

  render() {
    const { treeData } = this.state;
    const { collection } = this.props;
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
          generateNodeProps={({ node }) => ({
            buttons: [
              <TreeNavLink
                exact
                key={node.path}
                to={`/collections/${collection.get('name')}/filter/path=${node.path}`}
                activeClassName="sidebar-active"
              >
                <Icon type="list" size="small" />
              </TreeNavLink>,
            ],
          })}
          getNodeKey={getNodeKey}
          canDrag={() => false}
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

export default connect(mapStateToProps, null)(NestedCollection);
