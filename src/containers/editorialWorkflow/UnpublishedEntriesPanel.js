import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { OrderedMap } from 'immutable';
import { connect } from 'react-redux';
import { loadUnpublishedEntries, updateUnpublishedEntryStatus, publishUnpublishedEntry } from '../../actions/editorialWorkflow';
import { selectUnpublishedEntriesByStatus } from '../../reducers';
import { EDITORIAL_WORKFLOW, status } from '../../constants/publishModes';
import UnpublishedListing from '../../components/UnpublishedListing/UnpublishedListing';
import { Loader } from '../../components/UI';

class unpublishedEntriesPanel extends Component {
  static propTypes = {
    isEditorialWorkflow: PropTypes.bool.isRequired,
    isFetching: PropTypes.bool,
    unpublishedEntries: ImmutablePropTypes.map,
    loadUnpublishedEntries: PropTypes.func.isRequired,
    updateUnpublishedEntryStatus: PropTypes.func.isRequired,
    publishUnpublishedEntry: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const { loadUnpublishedEntries, isEditorialWorkflow } = this.props;
    if (isEditorialWorkflow) {
      loadUnpublishedEntries();
    }
  }

  render() {
    const { isEditorialWorkflow, isFetching, unpublishedEntries, updateUnpublishedEntryStatus, publishUnpublishedEntry } = this.props;
    if (!isEditorialWorkflow) return null;
    if (isFetching) return <Loader active>Loading Editorial Workflow Entries</Loader>;
    return (
      <UnpublishedListing
        entries={unpublishedEntries}
        handleChangeStatus={updateUnpublishedEntryStatus}
        handlePublish={publishUnpublishedEntry}
      />
    );
  }
}

function mapStateToProps(state) {
  const isEditorialWorkflow = (state.config.get('publish_mode') === EDITORIAL_WORKFLOW);
  const returnObj = { isEditorialWorkflow };

  if (isEditorialWorkflow) {
    returnObj.isFetching = state.editorialWorkflow.getIn(['pages', 'isFetching'], false);

    /*
     * Generates an ordered Map of the available status as keys.
     * Each key containing a Sequence of available unpubhlished entries
     * Eg.: OrderedMap{'draft':Seq(), 'pending_review':Seq(), 'pending_publish':Seq()}
     */
    returnObj.unpublishedEntries = status.reduce((acc, currStatus) => (
      acc.set(currStatus, selectUnpublishedEntriesByStatus(state, currStatus))
    ), OrderedMap());
  }
  return returnObj;
}

export default connect(mapStateToProps, {
  loadUnpublishedEntries,
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
})(unpublishedEntriesPanel);
