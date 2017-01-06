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
    const { collections } = state;
    const isEditorialWorkflow = (state.config.get('publish_mode') === EDITORIAL_WORKFLOW);
    const unpublishedEntry = ownProps.route && ownProps.route.unpublishedEntry === true;

    const returnObj = { isEditorialWorkflow };
    if (isEditorialWorkflow && unpublishedEntry) {
      const slug = ownProps.params.slug;
      const collection = collections.get(ownProps.params.name);
      const entry = selectUnpublishedEntry(state, collection, slug);
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
        dispatch(loadUnpublishedEntry(collection, slug));
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
