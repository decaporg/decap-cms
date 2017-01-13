import React from 'react';
import { connect } from 'react-redux';
import { EDITORIAL_WORKFLOW } from '../../constants/publishModes';
import { selectUnpublishedEntry, selectEntry } from '../../reducers';
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
    const returnObj = { isEditorialWorkflow };
    if (isEditorialWorkflow) {
      const slug = ownProps.params.slug;
      const collection = collections.get(ownProps.params.name);
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
      returnObj.loadEntry = (collection, slug) => {
        dispatch(loadUnpublishedEntry(collection, slug));
      };
      
      // Overwrite persistEntry to persistUnpublishedEntry
      returnObj.persistEntry = (collection) => {
        dispatch(persistUnpublishedEntry(collection, unpublishedEntry));
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
