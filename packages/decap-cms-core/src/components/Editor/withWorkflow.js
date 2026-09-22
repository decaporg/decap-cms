import { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { EDITORIAL_WORKFLOW } from '../../constants/publishModes';
import { selectUnpublishedEntry } from '../../reducers';
import { selectAllowDeletion } from '../../reducers/collections';
import { loadUnpublishedEntry, persistUnpublishedEntry } from '../../actions/editorialWorkflow';

function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const isEditorialWorkflow = state.config.publish_mode === EDITORIAL_WORKFLOW;
  const collection = collections.get(ownProps.match.params.name);

  // See the matching guard in Editor.js's own mapStateToProps — same race,
  // same reason. WorkflowEditor's render() below is what actually stops
  // Editor from mounting in this case; this just has to not crash while
  // computing props for it.
  if (!collection) {
    return { isEditorialWorkflow };
  }

  const returnObj = {
    isEditorialWorkflow,
    showDelete: !ownProps.newEntry && selectAllowDeletion(collection),
  };
  if (isEditorialWorkflow) {
    const slug = ownProps.match.params[0];
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
    class WorkflowEditor extends Component {
      render() {
        // Editor assumes a valid `collection` from its very first lifecycle
        // method (componentDidMount calls retrieveLocalBackup(collection, ...)
        // before render ever gets a say) — so the guard has to live here,
        // stopping it from mounting at all, not inside Editor itself.
        if (!this.props.collection) {
          return <Redirect to="/" />;
        }
        return <Editor {...this.props} />;
      }
    },
  );
}
