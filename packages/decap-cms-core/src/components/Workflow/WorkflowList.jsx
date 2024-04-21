import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import { translate } from 'react-polyglot';
import color from 'color';
import { Card, Icon, Tag } from 'decap-cms-ui-next';

import { status } from '../../constants/publishModes';
import { DragSource, DropTarget, HTML5DragDrop } from '../UI';
import WorkflowCard from './WorkflowCard';
import { selectInferredField } from '../../reducers/collections';

const WorkflowListContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: 1rem;

  position: relative;
  overflow: hidden;
  scroll-snap-align: center;
`;

const WorkflowListContainerOpenAuthoring = styled.div`
  min-height: 60%;
  display: grid;
  grid-template-columns: 50% 50% 0%;
`;

const Column = styled(Card)`
  height: 100%;

  display: flex;
  flex-direction: column;
  flex: 1;
  /* gap: 1rem; */

  ${props =>
    props.name === 'draft' &&
    css`
      background-color: ${color(props.theme.color.blue[900]).alpha(0.15).string()};
      box-shadow: inset 0 0 0 1.5px ${props.theme.color.blue[900]};
      color: ${props.theme.color.blue[900]};
    `}

  ${props =>
    props.name === 'pending_review' &&
    css`
      background-color: ${color(props.theme.color.yellow[900]).alpha(0.15).string()};
      box-shadow: inset 0 0 0 1.5px ${props.theme.color.yellow[900]};
      color: ${props.theme.color.yellow[900]};
    `}

  ${props =>
    props.name === 'pending_publish' &&
    css`
      background-color: ${color(props.theme.color.green[900]).alpha(0.15).string()};
      box-shadow: inset 0 0 0 1.5px ${props.theme.color.green[900]};
      color: ${props.theme.color.green[900]};
    `}
`;

const ColumnHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;

  margin: 1rem;
`;

const ColumnHeaderTitle = styled.h2`
  font-size: 1rem;
  font-weight: bold;
  margin: 0;
  color: inherit;
`;

const ColumnSeparator = styled.hr`
  border: none;
  border-radius: 20px;
  ${props =>
    props.name === 'draft' &&
    css`
      border-top: 2px solid ${props.theme.color.blue[900]};
    `}

  ${props =>
    props.name === 'pending_review' &&
    css`
      border-top: 2px solid ${props.theme.color.yellow[900]};
    `}

  ${props =>
    props.name === 'pending_publish' &&
    css`
      border-top: 2px solid ${props.theme.color.green[900]};
    `}
  margin: 0 1rem;
`;

const WorkflowContainer = styled.div`
  ${({ theme }) => css`
    flex: 1;

    overflow-y: auto;
    scrollbar-color: ${theme.color.primary[900]} transparent;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
    margin: 1rem 0.25rem 1rem 1rem;
    padding-right: 0.25rem;

    display: flex;
    flex-direction: column;
    gap: 1rem;

    /* border-radius: 0.5rem; */
    /* background-color: ${color(theme.color.neutral['900'])
      .alpha(theme.darkMode ? 0.35 : 0.1)
      .string()}; */
  `}
`;
// This is a namespace so that we can only drop these elements on a DropTarget with the same
const DNDNamespace = 'cms-workflow';

function getColumnHeaderIconName(columnName) {
  switch (columnName) {
    case 'draft':
      return 'edit-3';
    case 'pending_review':
      return 'hard-drive';
    case 'pending_publish':
      return 'check';
  }
}

function getColumnHeaderText(columnName, t) {
  switch (columnName) {
    case 'draft':
      return t('workflow.workflowList.draftHeader');
    case 'pending_review':
      return t('workflow.workflowList.inReviewHeader');
    case 'pending_publish':
      return t('workflow.workflowList.readyHeader');
  }
}

class WorkflowList extends React.Component {
  static propTypes = {
    entries: ImmutablePropTypes.orderedMap,
    handleChangeStatus: PropTypes.func.isRequired,
    handlePublish: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isOpenAuthoring: PropTypes.bool,
    collections: ImmutablePropTypes.map.isRequired,
  };

  handleChangeStatus = (newStatus, dragProps) => {
    const slug = dragProps.slug;
    const collection = dragProps.collection;
    const oldStatus = dragProps.ownStatus;
    this.props.handleChangeStatus(collection, slug, oldStatus, newStatus);
  };

  requestDelete = (collection, slug, ownStatus) => {
    if (window.confirm(this.props.t('workflow.workflowList.onDeleteEntry'))) {
      this.props.handleDelete(collection, slug, ownStatus);
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
  renderColumns = (entries, column) => {
    const { collections, t } = this.props;
    if (!entries) return null;

    if (!column) {
      return entries.entrySeq().map(([currColumn, currEntries]) => (
        <DropTarget
          namespace={DNDNamespace}
          key={currColumn}
          onDrop={this.handleChangeStatus.bind(this, currColumn)}
        >
          {connect =>
            connect(
              <div style={{ flexBasis: '33.33333%' }}>
                <Column name={currColumn}>
                  <ColumnHeader>
                    <Icon name={getColumnHeaderIconName(currColumn)} size={'lg'} />

                    <ColumnHeaderTitle name={currColumn}>
                      {getColumnHeaderText(currColumn, this.props.t)}
                    </ColumnHeaderTitle>

                    <Tag
                      color={
                        currColumn === 'draft'
                          ? 'blue'
                          : currColumn === 'pending_review'
                          ? 'yellow'
                          : 'green'
                      }
                    >
                      {this.props.t('workflow.workflowList.currentEntries', {
                        smart_count: currEntries.size,
                      })}
                    </Tag>
                  </ColumnHeader>

                  <ColumnSeparator name={currColumn} />

                  {this.renderColumns(currEntries, currColumn)}
                </Column>
              </div>,
            )
          }
        </DropTarget>
      ));
    }

    return (
      <WorkflowContainer>
        {entries.map(entry => {
          const timestamp = dayjs(entry.get('updatedOn')).format(t('workflow.workflow.dateFormat'));
          const slug = entry.get('slug');
          const collectionName = entry.get('collection');
          const editLink = `collections/${collectionName}/entries/${slug}?ref=workflow`;
          const ownStatus = entry.get('status');
          const collection = collections.find(
            collection => collection.get('name') === collectionName,
          );
          const collectionLabel = collection?.get('label');
          const isModification = entry.get('isModification');

          const allowPublish = collection?.get('publish');
          const canPublish = ownStatus === status.last() && !entry.get('isPersisting', false);
          const postAuthor = entry.get('author');

          const titleField = selectInferredField(collection, 'title');
          const imageField = selectInferredField(collection, 'image');

          const title = entry.getIn(['data', titleField]);
          let image = entry.getIn(['data', imageField]);
          if (image) {
            image = encodeURI(image);
          }

          return (
            <DragSource
              namespace={DNDNamespace}
              key={`${collectionName}-${slug}`}
              slug={slug}
              collection={collectionName}
              ownStatus={ownStatus}
            >
              {connect =>
                connect(
                  <div style={{ width: '100%' }}>
                    <WorkflowCard
                      collectionLabel={collectionLabel || collectionName}
                      image={image}
                      title={title}
                      authorLastChange={entry.getIn(['metaData', 'user'])}
                      body={entry.getIn(['data', 'body'])}
                      isModification={isModification}
                      editLink={editLink}
                      timestamp={timestamp}
                      onDelete={this.requestDelete.bind(this, collectionName, slug, ownStatus)}
                      allowPublish={allowPublish}
                      canPublish={canPublish}
                      onPublish={this.requestPublish.bind(this, collectionName, slug, ownStatus)}
                      postAuthor={postAuthor}
                    />
                  </div>,
                )
              }
            </DragSource>
          );
        })}
      </WorkflowContainer>
    );
  };

  render() {
    const columns = this.renderColumns(this.props.entries);
    const ListContainer = this.props.isOpenAuthoring
      ? WorkflowListContainerOpenAuthoring
      : WorkflowListContainer;
    return <ListContainer>{columns}</ListContainer>;
  }
}

export default HTML5DragDrop(translate()(WorkflowList));
