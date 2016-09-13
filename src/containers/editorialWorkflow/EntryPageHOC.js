import React from 'react';
import { EDITORIAL_WORKFLOW } from '../../constants/publishModes';
import { selectUnpublishedEntry } from '../../reducers';
import { loadUnpublishedEntry } from '../../actions/editorialWorkflow';
import { connect } from 'react-redux';

export default function EntryPageHOC(EntryPage) {
  class EntryPageHOC extends React.Component {
    render() {
      return <EntryPage {...this.props}/>;
    }
  }

  function mapStateToProps(state, ownProps) {
    const publish_mode = state.config.get('publish_mode');
    const isEditorialWorkflow = (publish_mode === EDITORIAL_WORKFLOW);
    const unpublishedEntry = ownProps.route && ownProps.route.unpublishedEntry === true;

    const returnObj = {};
    if (isEditorialWorkflow && unpublishedEntry) {
      const status = ownProps.params.status;
      const slug = ownProps.params.slug;
      const entry =  selectUnpublishedEntry(state, status, slug);
      returnObj.entry = entry;

      returnObj.persistEntry = () => {
        // TODO - for now, simply ignore
      };
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
    }
    return returnObj;
  }

  return connect(mapStateToProps, mapDispatchToProps)(EntryPageHOC);
}
