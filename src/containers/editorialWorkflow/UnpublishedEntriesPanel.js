import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { OrderedMap } from 'immutable';
import { connect } from 'react-redux';
import { loadUnpublishedEntries, updateUnpublishedEntryStatus, publishUnpublishedEntry } from '../../actions/editorialWorkflow';
import { selectUnpublishedEntries } from '../../reducers';
import { EDITORIAL_WORKFLOW, status } from '../../constants/publishModes';
import UnpublishedListing from '../../components/UnpublishedListing';

class unpublishedEntriesPanel extends Component {
  static propTypes = {
    isEditorialWorkflow: PropTypes.bool.isRequired,
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
    const { isEditorialWorkflow, unpublishedEntries, updateUnpublishedEntryStatus, publishUnpublishedEntry } = this.props;
    if (!isEditorialWorkflow) return null;

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
    /*
     * Generates an ordered Map of the available status as keys.
     * Each key containing a List of available unpubhlished entries
     * Eg.: OrderedMap{'draft':List(), 'pending_review':List(), 'pending_publish':List()}
     */
    returnObj.unpublishedEntries = status.reduce((acc, currStatus) => (
      acc.set(currStatus, selectUnpublishedEntries(state, currStatus))
    ), OrderedMap());
  }
  return returnObj;
}

export default connect(mapStateToProps, {
  loadUnpublishedEntries,
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
})(unpublishedEntriesPanel);
