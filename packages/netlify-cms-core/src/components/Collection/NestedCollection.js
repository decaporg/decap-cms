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
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { getFilterPath } from '../../routing/helpers';

const StyledDiv = styled.div`
  display: flex;
`;

const TreeNavLink = styled(NavLink)`
  display: flex;
  font-size: 14px;
  font-weight: 500;
  align-items: center;
  padding: 8px;
  padding-left: ${props => props.depth * 20 + 12}px;
  border-left: 2px solid #fff;

  ${Icon} {
    margin-right: 8px;
    flex-shrink: 0;
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

const TreeNode = props => {
  const { collection, treeData, depth = 0, onToggle } = props;
  const collectionName = collection.get('name');

  return treeData.map(node => {
    return (
      <React.Fragment key={node.path}>
        <TreeNavLink
          exact
          to={`/collections/${collectionName}/filter${node.path}`}
          activeClassName="sidebar-active"
          onClick={() => onToggle({ node, expanded: !node.expanded })}
          depth={depth}
        >
          <Icon type={depth === 0 || !node.isDir ? 'write' : 'folder'} />
          <StyledDiv>
            {node.title}
            {node.children.length > 0 ? (
              <Icon type="chevron" size="small" direction={node.expanded ? 'down' : 'right'} />
            ) : null}
          </StyledDiv>
        </TreeNavLink>
        {node.expanded && (
          <TreeNode
            collection={collection}
            depth={depth + 1}
            treeData={node.children}
            onToggle={onToggle}
          />
        )}
      </React.Fragment>
    );
  });
};

TreeNode.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  depth: PropTypes.number,
  treeData: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const walk = (treeData, callback) => {
  const traverse = children => {
    for (const child of children) {
      callback(child);
      traverse(child.children);
    }
  };

  return traverse(treeData);
};

const getTreeData = (collection, entries) => {
  const collectionFolder = collection.get('folder');
  const rootFolder = '/';
  const entriesObj = entries
    .toJS()
    .map(e => ({ ...e, path: e.path.substring(collectionFolder.length) }));

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
    },
    ...Object.entries(dirs).map(([key, value]) => ({
      title: value,
      path: key,
      isDir: true,
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
      };
    }),
  ];

  const parentsToChildren = flatData.reduce((acc, node) => {
    const parent = node.path === rootFolder ? '' : dirname(node.path);
    if (acc[parent]) {
      acc[parent].push(node);
    } else {
      acc[parent] = [node];
    }
    return acc;
  }, {});

  const reducer = (acc, value) => {
    const node = value;
    let children = [];
    if (parentsToChildren[node.path]) {
      children = parentsToChildren[node.path].reduce(reducer, []);
    }

    acc.push({ ...node, children });
    return acc;
  };

  const treeData = parentsToChildren[''].reduce(reducer, []);
  return treeData;
};

const updateNode = (collection, treeData, node, callback) => {
  let stop = false;

  const updater = nodes => {
    if (stop) {
      return nodes;
    }
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].path === node.path) {
        nodes[i] = callback(node);
        stop = true;
        return nodes;
      }
    }
    nodes.forEach(node => updater(node.children));
    return nodes;
  };

  return updater([...treeData]);
};

class NestedCollection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    entries: ImmutablePropTypes.list.isRequired,
    filterTerm: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      treeData: getTreeData(this.props.collection, this.props.entries),
      selected: null,
      useFilter: true,
    };
  }

  componentDidUpdate(prevProps) {
    const { collection, entries, filterTerm } = this.props;
    if (collection !== prevProps.collection || entries !== prevProps.entries) {
      const expanded = {};
      walk(this.state.treeData, node => {
        if (node.expanded) {
          expanded[node.path] = true;
        }
      });
      const treeData = getTreeData(collection, entries);

      const path = `/${getFilterPath(filterTerm)}`;
      walk(treeData, node => {
        if (expanded[node.path] || (this.state.useFilter && path.startsWith(node.path))) {
          node.expanded = true;
        }
      });
      this.setState({ treeData });
    }
  }

  onToggle = ({ node, expanded }) => {
    if (!this.state.selected || this.state.selected.path === node.path || expanded) {
      const treeData = updateNode(this.props.collection, this.state.treeData, node, node => ({
        ...node,
        expanded,
      }));
      this.setState({ treeData, selected: node, useFilter: false });
    } else {
      // don't collapse non selected nodes when clicked
      this.setState({ selected: node, useFilter: false });
    }
  };

  render() {
    const { treeData } = this.state;
    const { collection } = this.props;

    return <TreeNode collection={collection} treeData={treeData} onToggle={this.onToggle} />;
  }
}

function mapStateToProps(state, ownProps) {
  const { collection } = ownProps;
  const entries = selectEntries(state.entries, collection.get('name')) || List();
  return { entries };
}

export default connect(mapStateToProps, null)(NestedCollection);
