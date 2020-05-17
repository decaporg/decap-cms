import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import moment from 'moment';
import { translate } from 'react-polyglot';
import { colors } from 'netlify-cms-ui-legacy';
import { status } from 'Constants/publishModes';
import { DragSource, DropTarget, HTML5DragDrop } from 'UI';
import WorkflowCard from './WorkflowCard';
import { selectEntryCollectionTitle } from 'Reducers/collections';

const WorkflowListContainer = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 33.3% 33.3% 33.3%;
`;

const WorkflowListContainerOpenAuthoring = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 50% 50% 0%;
`;

const ColumnList = styled.div`
  margin: 0 1rem;
  transition: background-color 0.5s ease;
  border: 1px dotted transparent;
  border-radius: 4px;
  position: relative;
  height: 100%;
  ${({ theme, isHovered }) => (isHovered ? `border-color: ${theme.color.primary['900']};` : ``)}
  ${({ hidden }) => (hidden ? `display: none;` : ``)}
  ${({ hiddenRightBorder }) =>
    hiddenRightBorder
      ? `
    &:not(:first-child):not(:last-child) {
      &:after {
        display: none;
      }
    }
  `
      : ``}
  ${({ theme, idx }) =>
    idx === 0
      ? `
    margin-left: 0;
  `
      : idx === 2
      ? `
    margin-right: 0;
  `
      : `
    &:before,
    &:after {
      content: '';
      display: block;
      position: absolute;
      width: 1px;
      height: 100%;
      top: 0;
      background-color: ${theme.color.border};
    }
    &:before {
      left: -1rem;
    }

    &:after {
      right: -1rem;
    }
  `}
`;

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
`;

const ColumnTitle = styled.h2`
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.color.highEmphasis};
`;

const ColumnCount = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.text};
  text-transform: uppercase;
  margin-bottom: 0;
`;

// This is a namespace so that we can only drop these elements on a DropTarget with the same
const DNDNamespace = 'cms-workflow';

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

class WorkflowList extends React.Component {
  static propTypes = {
    entries: ImmutablePropTypes.orderedMap,
    handleChangeStatus: PropTypes.func.isRequired,
    handlePublish: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isOpenAuthoring: PropTypes.bool,
    collections: ImmutablePropTypes.orderedMap.isRequired,
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
    const { isOpenAuthoring, collections, t } = this.props;
    if (!entries) return null;

    if (!column) {
      return entries.entrySeq().map(([currColumn, currEntries], idx) => (
        <DropTarget
          namespace={DNDNamespace}
          key={currColumn}
          onDrop={this.handleChangeStatus.bind(this, currColumn)}
        >
          {(connect, { isHovered }) =>
            connect(
              <div style={{ height: '100%' }}>
                <ColumnList
                  idx={idx}
                  hidden={isOpenAuthoring && currColumn === 'pending_publish'}
                  hiddenRightBorder={isOpenAuthoring && currColumn === 'pending_review'}
                  isHovered={isHovered}
                >
                  <ColumnHeader>
                    <ColumnTitle name={currColumn}>
                      {getColumnHeaderText(currColumn, this.props.t)}
                    </ColumnTitle>
                    <ColumnCount>
                      {this.props.t('workflow.workflowList.currentEntries', {
                        smart_count: currEntries.size,
                      })}
                    </ColumnCount>
                  </ColumnHeader>
                  {this.renderColumns(currEntries, currColumn)}
                </ColumnList>
              </div>,
            )
          }
        </DropTarget>
      ));
    }
    return (
      <div>
        {entries.map(entry => {
          const timestamp = moment(entry.getIn(['metaData', 'timeStamp'])).format(
            t('workflow.workflow.dateFormat'),
          );
          const slug = entry.get('slug');
          const editLink = `collections/${entry.getIn(['metaData', 'collection'])}/entries/${slug}`;
          const ownStatus = entry.getIn(['metaData', 'status']);
          const collectionName = entry.getIn(['metaData', 'collection']);
          const collection = collections.find(
            collection => collection.get('name') === collectionName,
          );
          const collectionLabel = collection?.get('label');
          const isModification = entry.get('isModification');

          const allowPublish = collection?.get('publish');
          const canPublish = ownStatus === status.last() && !entry.get('isPersisting', false);

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
                  <div>
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
                    />
                  </div>,
                )
              }
            </DragSource>
          );
        })}
      </div>
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
