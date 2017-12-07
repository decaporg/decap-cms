import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { OrderedMap } from 'immutable';
import { connect } from 'react-redux';
import { createNewEntry } from 'Actions/collections';
import {
  loadUnpublishedEntries,
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
  deleteUnpublishedEntry
} from 'Actions/editorialWorkflow';
import { selectUnpublishedEntriesByStatus } from 'Reducers';
import { EDITORIAL_WORKFLOW, status } from 'Constants/publishModes';
import { Loader, Dropdown, DropdownItem } from 'UI';
import WorkflowList from './WorkflowList';

class Workflow extends Component {
  static propTypes = {
    collections: ImmutablePropTypes.orderedMap,
    isEditorialWorkflow: PropTypes.bool.isRequired,
    isFetching: PropTypes.bool,
    unpublishedEntries: ImmutablePropTypes.map,
    loadUnpublishedEntries: PropTypes.func.isRequired,
    updateUnpublishedEntryStatus: PropTypes.func.isRequired,
    publishUnpublishedEntry: PropTypes.func.isRequired,
    deleteUnpublishedEntry: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const { loadUnpublishedEntries, isEditorialWorkflow, collections } = this.props;
    if (isEditorialWorkflow) {
      loadUnpublishedEntries(collections);
    }
  }

  render() {
    const {
      isEditorialWorkflow,
      isFetching,
      unpublishedEntries,
      updateUnpublishedEntryStatus,
      publishUnpublishedEntry,
      deleteUnpublishedEntry,
      collections,
    } = this.props;

    if (!isEditorialWorkflow) return null;
    if (isFetching) return <Loader active>Loading Editorial Workflow Entries</Loader>;
    const reviewCount = unpublishedEntries.get('pending_review').size;
    const readyCount = unpublishedEntries.get('pending_publish').size;

    return (
      <div className="nc-workflow">
        <div className="nc-workflow-top">
          <div className="nc-workflow-top-row">
            <h1 className="nc-workflow-top-heading">Editorial Workflow</h1>
            <Dropdown
              label="New Post"
              dropdownWidth="160px"
              dropdownPosition="left"
              dropdownTopOverlap="40px"
            >
              {
                collections.filter(collection => collection.get('create')).toList().map(collection =>
                  <DropdownItem
                    key={collection.get("name")}
                    label={collection.get("label")}
                    onClick={() => createNewEntry(collection.get('name'))}
                  />
                )
              }
            </Dropdown>
          </div>
          <p className="nc-workflow-top-description">
            {reviewCount} {reviewCount === 1 ? 'entry' : 'entries'} waiting for review, {readyCount} ready to go live.
          </p>
        </div>
        <WorkflowList
          entries={unpublishedEntries}
          handleChangeStatus={updateUnpublishedEntryStatus}
          handlePublish={publishUnpublishedEntry}
          handleDelete={deleteUnpublishedEntry}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { collections } = state;
  const isEditorialWorkflow = (state.config.get('publish_mode') === EDITORIAL_WORKFLOW);
  const returnObj = { collections, isEditorialWorkflow };

  if (isEditorialWorkflow) {
    returnObj.isFetching = state.editorialWorkflow.getIn(['pages', 'isFetching'], false);

    /*
     * Generates an ordered Map of the available status as keys.
     * Each key containing a Sequence of available unpubhlished entries
     * Eg.: OrderedMap{'draft':Seq(), 'pending_review':Seq(), 'pending_publish':Seq()}
     */
    returnObj.unpublishedEntries = status.reduce((acc, currStatus) => {
      const entries = selectUnpublishedEntriesByStatus(state, currStatus);
      return acc.set(currStatus, entries)
    }, OrderedMap());
  }
  return returnObj;
}

export default connect(mapStateToProps, {
  loadUnpublishedEntries,
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
  deleteUnpublishedEntry,
})(Workflow);
