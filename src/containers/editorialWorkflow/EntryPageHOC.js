import React from 'react';
import { connect } from 'react-redux';
import { EDITORIAL_WORKFLOW } from '../../constants/publishModes';
import { selectUnpublishedEntry, selectEntry } from '../../reducers';
import { selectAllowDeletion } from "../../reducers/collections";
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
    const collection = collections.get(ownProps.match.params.name);
    const returnObj = {
      isEditorialWorkflow,
      showDelete: !ownProps.newEntry && selectAllowDeletion(collection),
    };
    if (isEditorialWorkflow) {
      returnObj.showDelete = false;
      const slug = ownProps.match.params.slug;
      const unpublishedEntry = selectUnpublishedEntry(state, collection.get('name'), slug);
      if (unpublishedEntry) {
        returnObj.unpublishedEntry = true;
        returnObj.entry = unpublishedEntry;
      }
    }
    return returnObj;
  }

  function mergeProps(stateProps, dispatchProps, ownProps) {
    const { isEditorialWorkflow, unpublishedEntry } = stateProps;
    const { dispatch } = dispatchProps;
    const returnObj = {};

    if (isEditorialWorkflow) {
      // Overwrite loadEntry to loadUnpublishedEntry
      returnObj.loadEntry = (collection, slug) =>
        dispatch(loadUnpublishedEntry(collection, slug));

      // Overwrite persistEntry to persistUnpublishedEntry
      returnObj.persistEntry = collection =>
        dispatch(persistUnpublishedEntry(collection, unpublishedEntry));

      // Overwrite deleteEntry to a noop (deletion is currently
      // disabled in the editorial workflow)
      returnObj.deleteEntry = () => undefined;
    }

    return {
      ...ownProps,
      ...stateProps,
      ...returnObj,
    };
  }

  return connect(mapStateToProps, null, mergeProps)(EntryPageHOC);
}
