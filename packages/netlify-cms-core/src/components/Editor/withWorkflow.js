import React from 'react';
import { connect } from 'react-redux';
import { EDITORIAL_WORKFLOW } from 'Constants/publishModes';
import { selectUnpublishedEntry } from 'Reducers';
import { selectAllowDeletion } from 'Reducers/collections';
import { loadUnpublishedEntry, persistUnpublishedEntry } from 'Actions/editorialWorkflow';

function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const isEditorialWorkflow = state.config.get('publish_mode') === EDITORIAL_WORKFLOW;
  const collection = collections.get(ownProps.match.params.name);
  const returnObj = {
    isEditorialWorkflow,
    showDelete: !ownProps.newEntry && selectAllowDeletion(collection),
  };
  if (isEditorialWorkflow) {
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
    returnObj.loadEntry = (collection, slug) => dispatch(loadUnpublishedEntry(collection, slug));

    // Overwrite persistEntry to persistUnpublishedEntry
    returnObj.persistEntry = collection =>
      dispatch(persistUnpublishedEntry(collection, unpublishedEntry));
  }

  return {
    ...ownProps,
    ...stateProps,
    ...returnObj,
  };
}

export default function withWorkflow(Editor) {
  return connect(
    mapStateToProps,
    null,
    mergeProps,
  )(
    class WorkflowEditor extends React.Component {
      render() {
        return <Editor {...this.props} />;
      }
    },
  );
}
