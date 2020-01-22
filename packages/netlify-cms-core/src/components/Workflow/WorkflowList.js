import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import moment from 'moment';
import { translate } from 'react-polyglot';
import { colors, lengths, Icon } from 'netlify-cms-ui-default';
import { isCombineKey } from 'netlify-cms-lib-util';
import { status } from 'Constants/publishModes';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Tab as UnstyledTab, Tabs, TabList as UnstyledTabList, TabPanel } from 'react-tabs';
import WorkflowCard from './WorkflowCard';

const WorkflowListContainer = styled.div`
  min-height: 60%;
  display: grid;
  grid-template-columns: 33.3% 33.3% 33.3%;
`;

const WorkflowListContainerOpenAuthoring = styled.div`
  min-height: 60%;
  display: grid;
  grid-template-columns: 50% 50% 0%;
`;

const styles = {
  columnPosition: idx =>
    (idx === 0 &&
      css`
        margin-left: 0;
      `) ||
    (idx === 2 &&
      css`
        margin-right: 0;
      `) ||
    css`
      &:before,
      &:after {
        content: '';
        display: block;
        position: absolute;
        width: 2px;
        height: 80%;
        top: 76px;
        background-color: ${colors.textFieldBorder};
      }

      &:before {
        left: -23px;
      }

      &:after {
        right: -23px;
      }
    `,
  column: css`
    margin: 0 20px;
    transition: background-color 0.5s ease;
    border: 2px dashed transparent;
    border-radius: 4px;
    position: relative;
    height: 100%;
  `,
  columnHovered: css`
    border-color: ${colors.active};
  `,
  hiddenColumn: css`
    display: none;
  `,
  hiddenRightBorder: css`
    &:not(:first-child):not(:last-child) {
      &:after {
        display: none;
      }
    }
  `,
};

const ColumnHeader = styled.h2`
  font-size: 20px;
  font-weight: normal;
  padding: 4px 14px;
  border-radius: ${lengths.borderRadius};
  margin-bottom: 28px;

  ${props =>
    props.name === 'draft' &&
    css`
      background-color: ${colors.statusDraftBackground};
      color: ${colors.statusDraftText};
    `}

  ${props =>
    props.name === 'pending_review' &&
    css`
      background-color: ${colors.statusReviewBackground};
      color: ${colors.statusReviewText};
    `}

  ${props =>
    props.name === 'pending_publish' &&
    css`
      background-color: ${colors.statusReadyBackground};
      color: ${colors.statusReadyText};
    `}
`;

const ColumnCount = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.text};
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const TabList = styled(UnstyledTabList)`
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px;
  margin: 0;
  background-color: #fff;
  border-top-right-radius: 5px;
  border-top-left-radius: 5px;
`;
TabList.tabsRole = 'TabList';

const Tab = styled(UnstyledTab)`
  text-align: center;
  padding: 5px;
  list-style: none;
  cursor: pointer;
  margin: 0 2px;

  &.selected {
    color: ${colors.active};
  }
`;
Tab.tabsRole = 'Tab';

const getColumnHeaderText = (columnName, t) => {
  switch (columnName) {
    case 'draft':
      return t('workflow.workflowList.draftHeader');
    case 'pending_review':
      return t('workflow.workflowList.inReviewHeader');
    case 'pending_publish':
      return t('workflow.workflowList.readyHeader');
  }
};

const parseDraggableId = id => {
  const [collection, ...slugParts] = id.split('/');
  return { collection, slug: slugParts.join('/') };
};

class WorkflowList extends React.Component {
  static propTypes = {
    entries: ImmutablePropTypes.orderedMap,
    handleChangeStatus: PropTypes.func.isRequired,
    handlePublish: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
    handleCombineCollection: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isOpenAuthoring: PropTypes.bool,
  };

  onDragEnd = result => {
    const { source, destination, draggableId, combine } = result;

    const { collection, slug } = parseDraggableId(draggableId);
    if (combine) {
      if (isCombineKey(collection, slug) || combine.droppableId !== source.droppableId) return;
      const { collection: parentCollection, slug: parentSlug } = parseDraggableId(
        combine.draggableId,
      );
      const parent = {
        collection: parentCollection,
        slug: parentSlug,
        status: combine.droppableId,
      };
      const child = { collection, slug };
      return this.props.handleCombineCollection(parent, child);
    }

    destination &&
      this.props.handleChangeStatus(collection, slug, source.droppableId, destination.droppableId);
  };

  requestDelete = (collection, slug) => {
    if (window.confirm(this.props.t('workflow.workflowList.onDeleteEntry'))) {
      this.props.handleDelete(collection, slug);
    }
  };

  requestPublish = (collection, slug, ownStatus) => {
    if (ownStatus !== status.last()) {
      window.alert(this.props.t('workflow.workflowList.onPublishingNotReadyEntry'));
      return;
    } else if (!window.confirm(this.props.t('workflow.workflowList.onPublishEntry'))) {
      return;
    }
    this.props.handlePublish(collection, slug);
  };

  // eslint-disable-next-line react/display-name
  renderColumns = entries => {
    const { isOpenAuthoring } = this.props;
    if (!entries) return null;

    return entries.entrySeq().map(([currColumn, currEntries], idx) => (
      <Droppable droppableId={currColumn} key={currColumn} isCombineEnabled>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} style={{ height: '100%' }}>
            <div
              css={[
                styles.column,
                styles.columnPosition(idx),
                snapshot.isDraggingOver && styles.columnHovered,
                isOpenAuthoring && currColumn === 'pending_publish' && styles.hiddenColumn,
                isOpenAuthoring && currColumn === 'pending_review' && styles.hiddenRightBorder,
              ]}
            >
              <ColumnHeader name={currColumn}>
                {getColumnHeaderText(currColumn, this.props.t)}
              </ColumnHeader>
              <ColumnCount>
                {this.props.t('workflow.workflowList.currentEntries', {
                  smart_count: currEntries.size,
                })}
              </ColumnCount>
              {this.renderCards(currEntries, currColumn)}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    ));
  };

  renderCombineCards = (entries, count) => {
    if (entries.isEmpty()) return null;
    return entries.entrySeq().map(([key, currEntries], idx) => {
      return (
        <Draggable draggableId={`${key}`} index={count + idx} key={`${key}`}>
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
              <Tabs selectedTabClassName="selected">
                <TabList>
                  {currEntries.toArray().map((_, id) => (
                    <Tab key={id}>
                      <Icon type="page" size="small" />
                    </Tab>
                  ))}
                </TabList>
                {currEntries.map((entry, idx) => {
                  const { collection, slug } = parseDraggableId(key);
                  return (
                    <TabPanel key={idx}>
                      <WorkflowCard
                        {...this.workflowCardProps(entry)}
                        onDelete={this.requestDelete.bind(this, collection, slug)}
                        onPublish={this.requestPublish.bind(
                          this,
                          collection,
                          slug,
                          entry.getIn(['metaData', 'status']),
                        )}
                        snapshot={snapshot}
                        combineEntry
                      />
                    </TabPanel>
                  );
                })}
              </Tabs>
            </div>
          )}
        </Draggable>
      );
    });
  };

  renderCards = entries => {
    if (entries.isEmpty()) return null;
    const combineEntries = entries
      .filter(entry => entry.has('combineKey'))
      .groupBy(item => item.get('combineKey'));
    const singleEntries = entries.filterNot(entry => entry.has('combineKey'));
    const count = singleEntries.count();
    return (
      <div>
        {singleEntries.map((entry, idx) => {
          const collection = entry.getIn(['metaData', 'collection']);
          const slug = entry.get('slug');
          return (
            <Draggable
              draggableId={`${collection}/${slug}`}
              index={idx}
              key={`${collection}-${slug}`}
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                >
                  <WorkflowCard {...this.workflowCardProps(entry)} snapshot={snapshot} />
                </div>
              )}
            </Draggable>
          );
        })}
        {this.renderCombineCards(combineEntries, count)}
      </div>
    );
  };

  workflowCardProps = entry => {
    const timestamp = moment(entry.getIn(['metaData', 'timeStamp'])).format('MMMM D');
    const slug = entry.get('slug');
    const editLink = `collections/${entry.getIn(['metaData', 'collection'])}/entries/${slug}`;
    const ownStatus = entry.getIn(['metaData', 'status']);
    const collection = entry.getIn(['metaData', 'collection']);
    const isModification = entry.get('isModification');
    const canPublish = ownStatus === status.last() && !entry.get('isPersisting', false);
    return {
      collectionName: collection,
      title: entry.get('label') || entry.getIn(['data', 'title']),
      authorLastChange: entry.getIn(['metaData', 'user']),
      body: entry.getIn(['data', 'body']),
      isModification,
      editLink,
      timestamp,
      canPublish,
      onDelete: this.requestDelete.bind(this, collection, slug),
      onPublish: this.requestPublish.bind(this, collection, slug, ownStatus),
    };
  };

  render() {
    const columns = this.renderColumns(this.props.entries);
    const ListContainer = this.props.isOpenAuthoring
      ? WorkflowListContainerOpenAuthoring
      : WorkflowListContainer;
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <ListContainer>{columns}</ListContainer>
      </DragDropContext>
    );
  }
}

export default translate()(WorkflowList);
