import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import { translate } from 'react-polyglot';
import color from 'color';
import { Card, Icon } from 'decap-cms-ui-next';

import { status } from '../../constants/publishModes';
import { DragSource, DropTarget, HTML5DragDrop } from '../UI';
import WorkflowCard from './WorkflowCard';
import { selectEntryCollectionTitle } from '../../reducers/collections';

const WorkflowListContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;

  position: relative;
  min-height: 100%;

  scroll-snap-align: center;
`;

const WorkflowListContainerOpenAuthoring = styled.div`
  min-height: 60%;
  display: grid;
  grid-template-columns: 50% 50% 0%;
`;

const Column = styled.div`
  height: 100%;

  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.65rem;
`;

const ColumnHeader = styled(Card)`
  display: flex;
  flex-direction: row;
  align-items: center;

  padding: 0.5rem 0.75rem;

  ${props =>
    props.name === 'draft' &&
    css`
      background-color: ${color(props.theme.color.pink[900]).alpha(0.15).string()};
      box-shadow: inset 0 0 0 1.5px ${props.theme.color.pink[900]};
      color: ${props.theme.color.pink[900]};
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

const ColumnHeaderIcon = styled(Icon)`
  margin-right: 0.5rem;
`;

const ColumnHeaderTitle = styled.h2`
  font-size: 1rem;
  font-weight: bold;
  margin: 0;
  flex: 1;
  color: inherit;

  /* ${props =>
    props.name === 'draft' &&
    css`
      color: ${props.theme.darkMode ? props.theme.color.pink[400] : props.theme.color.pink[900]};
    `}

  ${props =>
    props.name === 'pending_review' &&
    css`
      color: ${props.theme.darkMode
        ? props.theme.color.yellow[400]
        : props.theme.color.yellow[900]};
    `}

  ${props =>
    props.name === 'pending_publish' &&
    css`
      color: ${props.theme.darkMode ? props.theme.color.green[400] : props.theme.color.green[900]};
    `} */
`;

const ColumnHeaderCount = styled.p`
  font-size: 2rem;
  font-weight: 500;
  line-height: initial;
  margin-bottom: 0;
`;

const WorkflowContainer = styled.div`
  ${({ theme }) => css`
    flex: 1;

    display: flex;
    flex-direction: row;

    border-radius: 0.5rem;
    padding: 0.5rem;
    background-color: ${color(theme.color.neutral['900'])
      .alpha(theme.darkMode ? 0.35 : 0.1)
      .string()};
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
      return entries.entrySeq().map(([currColumn, currEntries], idx) => (
        <DropTarget
          namespace={DNDNamespace}
          key={currColumn}
          onDrop={this.handleChangeStatus.bind(this, currColumn)}
        >
          {connect =>
            connect(
              <div style={{ flexBasis: '33.33333%' }}>
                <Column>
                  <ColumnHeader name={currColumn}>
                    <ColumnHeaderIcon name={getColumnHeaderIconName(currColumn)} size={'lg'} />

                    <ColumnHeaderTitle name={currColumn}>
                      {getColumnHeaderText(currColumn, this.props.t)}
                    </ColumnHeaderTitle>

                    <ColumnHeaderCount>{currEntries.size}</ColumnHeaderCount>
                  </ColumnHeader>
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
                      title={selectEntryCollectionTitle(collection, entry)}
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
