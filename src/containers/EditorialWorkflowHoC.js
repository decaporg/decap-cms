import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map } from 'immutable';
import { init, loadUnpublishedEntries } from '../actions/editorialWorkflow';
import { selectUnpublishedEntries } from '../reducers';
import { EDITORIAL_WORKFLOW, status } from '../constants/publishModes';
import UnpublishedListing from '../components/UnpublishedListing';
import { connect } from 'react-redux';
import _ from 'lodash';

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
      returnObj.unpublishedEntries = _.reduce(status, (acc, currStatus) => {
        return acc.set(currStatus, selectUnpublishedEntries(state, currStatus));
      }, Map());
    }

    return returnObj;
  }

  return connect(mapStateToProps)(EditorialWorkflow);
}
