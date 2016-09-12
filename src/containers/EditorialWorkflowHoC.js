import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { OrderedMap } from 'immutable';
import { init, loadUnpublishedEntries } from '../actions/editorialWorkflow';
import { selectUnpublishedEntries } from '../reducers';
import { EDITORIAL_WORKFLOW, status } from '../constants/publishModes';
import UnpublishedListing from '../components/UnpublishedListing';
import { connect } from 'react-redux';

export default function EditorialWorkflow(WrappedComponent) {
  class EditorialWorkflow extends WrappedComponent {

    componentDidMount() {
      const { dispatch, isEditorialWorkflow } = this.props;
      if (isEditorialWorkflow) {
        dispatch(init());
        dispatch(loadUnpublishedEntries());
      }
      super.componentDidMount();
    }

    render() {
      const { isEditorialWorkflow, unpublishedEntries } = this.props;
      if (!isEditorialWorkflow) return super.render();

      return (
        <div>
          <UnpublishedListing entries={unpublishedEntries}/>
          {super.render()}
        </div>
      );
    }
  }

  EditorialWorkflow.propTypes = {
    dispatch: PropTypes.func.isRequired,
    isEditorialWorkflow: PropTypes.bool.isRequired,
    unpublishedEntries: ImmutablePropTypes.map,
  };

  function mapStateToProps(state) {
    const publish_mode = state.config.get('publish_mode');
    const isEditorialWorkflow = (publish_mode === EDITORIAL_WORKFLOW);
    const returnObj = { isEditorialWorkflow };

    if (isEditorialWorkflow) {
      /*
       * Generates an ordered Map of the available status as keys.
       * Each key containing a List of available unpubhlished entries
       * Eg.: OrderedMap{'draft':List(), 'pending_review':List(), 'pending_publish':List()}
       */
      returnObj.unpublishedEntries = status.reduce((acc, currStatus) => {
        return acc.set(currStatus, selectUnpublishedEntries(state, currStatus));
      }, OrderedMap());
    }
    return returnObj;
  }

  return connect(mapStateToProps)(EditorialWorkflow);
}
