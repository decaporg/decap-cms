import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import { translate } from 'react-polyglot';
import { Card, Icon, Badge, withAlert, withConfirm } from 'decap-cms-ui-next';

import { status } from '../../constants/publishModes';
import { DragSource, DropTarget, HTML5DragDrop } from '../UI';
import WorkflowCard from './WorkflowCard';
import { selectInferredField } from '../../reducers/collections';
import {
  getWorkflowStatusIconName,
  getWorkflowStatusColor,
  getWorkflowStatusTranslatedKey,
} from '../../lib/editorialWorkflowHelper';

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

const Column = styled.div`
  height: 100%;

  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1rem;
`;

const ColumnHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
`;

const StyledBadge = styled(Badge)`
  ${({ theme, color }) => css`
    background-color: ${theme.color[color]['500']} !important;
    color: ${theme.color[color]['1400']};
    gap: 0.5rem;
    padding-top: 0.325rem;
    padding-bottom: 0.325rem;
  `}
`;

const ColumnHeaderTitle = styled.h2`
  color: inherit;
  margin: 0;
`;

const EntriesCount = styled.span`
  font-size: 0.8rem;
`;

const WorkflowContainer = styled(Card)`
  ${({ theme }) => css`
    flex: 1;

    overflow-y: auto;
    scrollbar-color: ${theme.color.primary[900]} transparent;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
    padding: 0.5rem;

    display: flex;
    flex-direction: column;
    gap: 1rem;
  `}
`;

// This is a namespace so that we can only drop these elements on a DropTarget with the same
const DNDNamespace = 'cms-workflow';

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
    if (confirm(this.props.t('workflow.workflowList.onDeleteEntry'))) {
      this.props.handleDelete(collection, slug, ownStatus);
    }
  };

  requestPublish = (collection, slug, ownStatus) => {
    if (ownStatus !== status.last()) {
      alert(this.props.t('workflow.workflowList.onPublishingNotReadyEntry'));
      return;
    } else if (!confirm(this.props.t('workflow.workflowList.onPublishEntry'))) {
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
                    <StyledBadge
                      color={getWorkflowStatusColor(currColumn)}
                      variant="soft"
                      radius="full"
                      size="lg"
                    >
                      <Icon name={getWorkflowStatusIconName(currColumn)} size={'lg'} />

                      <ColumnHeaderTitle color={getWorkflowStatusColor(currColumn)}>
                        {t(getWorkflowStatusTranslatedKey(currColumn))}
                      </ColumnHeaderTitle>
                    </StyledBadge>

                    <EntriesCount>
                      {this.props.t('workflow.workflowList.currentEntries', {
                        smart_count: currEntries.size,
                      })}
                    </EntriesCount>
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

export default HTML5DragDrop(withAlert(withConfirm(translate()(WorkflowList))));
