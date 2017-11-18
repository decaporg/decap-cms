import PropTypes from 'prop-types';
import React from 'react';
import { DragSource, DropTarget, HTML5DragDrop } from '../components/UI/dndHelpers';
import ImmutablePropTypes from 'react-immutable-proptypes';
import moment from 'moment';
import { capitalize } from 'lodash'
import classnames from 'classnames';
import WorkflowCard from './WorkflowCard';
import { status, statusDescriptions } from '../constants/publishModes';

// This is a namespace so that we can only drop these elements on a DropTarget with the same
const DNDNamespace = 'cms-workflow';

class WorkflowList extends React.Component {
  static propTypes = {
    entries: ImmutablePropTypes.orderedMap,
    handleChangeStatus: PropTypes.func.isRequired,
    handlePublish: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
  };

  handleChangeStatus = (newStatus, dragProps) => {
    const slug = dragProps.slug;
    const collection = dragProps.collection;
    const oldStatus = dragProps.ownStatus;
    this.props.handleChangeStatus(collection, slug, oldStatus, newStatus);
  };

  requestDelete = (collection, slug, ownStatus) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      this.props.handleDelete(collection, slug, ownStatus);
    }
  };
  requestPublish = (collection, slug, ownStatus) => {
    if (ownStatus !== status.last()) return;
    if (window.confirm('Are you sure you want to publish this entry?')) {
      this.props.handlePublish(collection, slug, ownStatus);
    }
  };

  renderColumns = (entries, column) => {
    if (!entries) return null;

    if (!column) {
      return entries.entrySeq().map(([currColumn, currEntries]) => (
        <DropTarget
          namespace={DNDNamespace}
          key={currColumn}
          /* eslint-disable */
          onDrop={this.handleChangeStatus.bind(this, currColumn)}
          /* eslint-enable */
        >
          {(connect, { isHovered }) => connect(
            <div className={classnames(
              'nc-workflow-list',
              { 'nc-workflow-list-hovered' : isHovered },
            )}>
              <h2 className="nc-workflow-list-heading">
                {statusDescriptions.get(currColumn)}
              </h2>
              {this.renderColumns(currEntries, currColumn)}
            </div>
          )}
        </DropTarget>
      ));
    }
    return (
      <div>
        {
          entries.map((entry) => {
            // Look for an "author" field. Fallback to username on backend implementation;
            const author = entry.getIn(['data', 'author'], entry.getIn(['metaData', 'user']));
            const timestamp = moment(entry.getIn(['metaData', 'timeStamp'])).format('llll');
            const editLink = `collections/${ entry.getIn(['metaData', 'collection']) }/entries/${ entry.get('slug') }`;
            const slug = entry.get('slug');
            const ownStatus = entry.getIn(['metaData', 'status']);
            const collection = entry.getIn(['metaData', 'collection']);
            const isModification = entry.get('isModification');
            const canPublish = ownStatus === status.last() && !entry.get('isPersisting', false);
            return (
              <DragSource
                namespace={DNDNamespace}
                key={slug}
                slug={slug}
                collection={collection}
                ownStatus={ownStatus}
              >
              {connect => connect(
                <div>
                  <WorkflowCard
                    title={entry.getIn(['data', 'title'])}
                    author={author}
                    authorLastChange={entry.getIn(['metaData', 'user'])}
                    isModification={isModification}
                    editLink={editLink}
                    timestamp={timestamp}
                    onDelete={this.requestDelete.bind(this, collection, slug, ownStatus)}
                    canPublish={canPublish}
                    onPublish={this.requestPublish.bind(this, collection, slug, ownStatus)}
                  />
                </div>
              )}
              </DragSource>
            );
          })
        }
      </div>
    );
  };

  render() {
    const columns = this.renderColumns(this.props.entries);
    return (
      <div>
        <h5>Editorial Workflow</h5>
        <div className="nc-workflow-list-container">
          {columns}
        </div>
      </div>
    );
  }
}

export default HTML5DragDrop(WorkflowList); // eslint-disable-line
