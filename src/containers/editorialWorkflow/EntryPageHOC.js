import React from 'react';
import { connect } from 'react-redux';
import { EDITORIAL_WORKFLOW } from '../../constants/publishModes';
import { selectUnpublishedEntry } from '../../reducers';
import { loadUnpublishedEntry, persistUnpublishedEntry } from '../../actions/editorialWorkflow';

export default function EntryPageHOC(EntryPage) {
  function WrappedComponent(props) {
    return <EntryPage {...props} />;
  }

  function mapStateToProps(state, ownProps) {
    const publishMode = state.config.get('publish_mode');
    const isEditorialWorkflow = (publishMode === EDITORIAL_WORKFLOW);
    const unpublishedEntry = ownProps.route && ownProps.route.unpublishedEntry === true;

    const returnObj = {};
    if (isEditorialWorkflow && unpublishedEntry) {
      const status = ownProps.params.status;
      const slug = ownProps.params.slug;
      returnObj.entry = selectUnpublishedEntry(state, status, slug);
    }
    return returnObj;
  }

  function mapDispatchToProps(dispatch, ownProps) {
    const unpublishedEntry = ownProps.route && ownProps.route.unpublishedEntry === true;
    const returnObj = {};
    if (unpublishedEntry) {
      // Overwrite loadEntry to loadUnpublishedEntry
      const status = ownProps.params.status;
      returnObj.loadEntry = (collection, slug) => {
        dispatch(loadUnpublishedEntry(collection, status, slug));
      };

      returnObj.persistEntry = (collection, entryDraft) => {
        dispatch(persistUnpublishedEntry(collection, entryDraft));
      };
    }
    return returnObj;
  }

  return connect(mapStateToProps, mapDispatchToProps)(WrappedComponent);
}
