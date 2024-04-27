import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { NavLink, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import { List } from 'immutable';
import { sortBy } from 'lodash';
import styled from '@emotion/styled';
import { dirname, sep } from 'path';
import { stringTemplate } from 'decap-cms-lib-widgets';
import { NavMenuItem, Icon } from 'decap-cms-ui-next';

import { selectEntries } from '../../reducers/entries';
import { selectEntryCollectionTitle } from '../../reducers/collections';

const { addFileTemplateFields } = stringTemplate;

const TreeNavLink = styled(NavMenuItem)`
  padding-left: ${({ depth }) => depth * 16 + 12}px;
`;

const ExpandedNavLinkIcon = styled(Icon)`
  transform: ${({ expanded }) => (expanded ? 'rotate(90deg)' : 'rotate(0deg)')};
  transition: 200ms;
`;

function getNodeTitle(node) {
  const title = node.isRoot
    ? node.title
    : node.children.find(c => !c.isDir && c.title)?.title || node.title;
  return title;
}

function TreeNode(props) {
  const { collection, treeData, depth = 0, onToggle } = props;
  const collectionName = collection.get('name');
  const collectionIcon = collection.get('icon');
  const { pathname } = useLocation();

  const sortedData = sortBy(treeData, getNodeTitle);
  return sortedData.map(node => {
    const leaf = node.children.length <= 1 && !node.children[0]?.isDir && depth > 0;
    if (leaf) {
      return null;
    }
    let to = `/collections/${collectionName}`;
    if (depth > 0) {
      to = `${to}/filter${node.path}`;
    }
    const title = getNodeTitle(node);

    const hasChildren = depth === 0 || node.children.some(c => c.children.some(c => c.isDir));

    return (
      <React.Fragment key={node.path}>
        <TreeNavLink
          exact
          as={NavLink}
          to={to}
          onClick={() => onToggle({ node, expanded: !node.expanded })}
          depth={depth}
          data-testid={node.path}
          active={pathname === to}
          icon={collectionIcon}
          endIcon={
            hasChildren ? (
              <ExpandedNavLinkIcon name="chevron-right" expanded={node.expanded} />
            ) : null
          }
        >
          {title}
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
}

TreeNode.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  depth: PropTypes.number,
  treeData: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export function walk(treeData, callback) {
  function traverse(children) {
    for (const child of children) {
      callback(child);
      traverse(child.children);
    }
  }

  return traverse(treeData);
}

export function getTreeData(collection, entries) {
  const collectionFolder = collection.get('folder');
  const rootFolder = '/';
  const entriesObj = entries
    .toJS()
    .map(e => ({ ...e, path: e.path.slice(collectionFolder.length) }));

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
      isRoot: true,
    },
    ...Object.entries(dirs).map(([key, value]) => ({
      title: value,
      path: key,
      isDir: true,
      isRoot: false,
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
        isRoot: false,
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

  function reducer(acc, value) {
    const node = value;
    let children = [];
    if (parentsToChildren[node.path]) {
      children = parentsToChildren[node.path].reduce(reducer, []);
    }

    acc.push({ ...node, children });
    return acc;
  }

  const treeData = parentsToChildren[''].reduce(reducer, []);

  return treeData;
}

export function updateNode(treeData, node, callback) {
  let stop = false;

  function updater(nodes) {
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
  }

  return updater([...treeData]);
}

export class NestedCollection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    entries: ImmutablePropTypes.list.isRequired,
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
    const { collection, entries } = this.props;
    if (collection !== prevProps.collection || entries !== prevProps.entries) {
      const expanded = {};
      walk(this.state.treeData, node => {
        if (node.expanded) {
          expanded[node.path] = true;
        }
      });
      const treeData = getTreeData(collection, entries);

      const path = '/';
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
      const treeData = updateNode(this.state.treeData, node, node => ({
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
  const entries = selectEntries(state.entries, collection) || List();
  return { entries };
}

export default connect(mapStateToProps, null)(NestedCollection);
