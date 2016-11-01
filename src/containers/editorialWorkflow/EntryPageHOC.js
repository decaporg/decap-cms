import React from 'react';
import { connect } from 'react-redux';
import { EDITORIAL_WORKFLOW } from '../../constants/publishModes';
import { selectUnpublishedEntry } from '../../reducers';
import { loadUnpublishedEntry, persistUnpublishedEntry } from '../../actions/editorialWorkflow';


export default function EntryPageHOC(EntryPage) {
  class EntryPageHOC extends React.Component {
    render() {
      return <EntryPage {...this.props} />;
    }
  }

  function mapStateToProps(state, ownProps) {
    const isEditorialWorkflow = (state.config.get('publish_mode') === EDITORIAL_WORKFLOW);
    const unpublishedEntry = ownProps.route && ownProps.route.unpublishedEntry === true;

    const returnObj = { isEditorialWorkflow };
    if (isEditorialWorkflow && unpublishedEntry) {
      const status = ownProps.params.status;
      const slug = ownProps.params.slug;
      const entry = selectUnpublishedEntry(state, status, slug);
      returnObj.entry = entry;
    }
    return returnObj;
  }

  function mergeProps(stateProps, dispatchProps, ownProps) {
    const { isEditorialWorkflow } = stateProps;
    const { dispatch } = dispatchProps;

    const unpublishedEntry = ownProps.route && ownProps.route.unpublishedEntry === true;
    const status = ownProps.params.status;

    const returnObj = {};

    if (unpublishedEntry) {
      // Overwrite loadEntry to loadUnpublishedEntry
      returnObj.loadEntry = (entry, collection, slug) => {
        dispatch(loadUnpublishedEntry(collection, status, slug));
      };
    }

    if (isEditorialWorkflow) {
      // Overwrite persistEntry to persistUnpublishedEntry
      returnObj.persistEntry = (collection, entryDraft) => {
        dispatch(persistUnpublishedEntry(collection, entryDraft, unpublishedEntry));
      };
    }

    return {
      ...ownProps,
      ...stateProps,
      ...returnObj,
    };
  }

  return connect(mapStateToProps, null, mergeProps)(EntryPageHOC);
}
