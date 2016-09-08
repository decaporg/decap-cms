import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { init, loadUnpublishedEntries } from '../actions/editorialWorkflow';
import { selectUnpublishedEntries } from '../reducers';
import { EDITORIAL_WORKFLOW } from '../constants/publishModes';
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
      const { isEditorialWorkflow } = this.props;
      if (!isEditorialWorkflow) return super.render();

      return (
        <div>
          <h2>HOC</h2>
          {super.render()}
        </div>
      );
    }
  }

  EditorialWorkflow.propTypes = {
    dispatch: PropTypes.func.isRequired,
    isEditorialWorkflow: PropTypes.bool.isRequired,
    unpublishedEntries: ImmutablePropTypes.list,
  };

  function mapStateToProps(state) {
    const publish_mode = state.config.get('publish_mode');
    const isEditorialWorkflow = (publish_mode === EDITORIAL_WORKFLOW);
    const returnObj = { isEditorialWorkflow };

    if (isEditorialWorkflow) {
      returnObj.unpublishedEntries = selectUnpublishedEntries(state, 'draft');
    }

    return returnObj;
  }

  return connect(mapStateToProps)(EditorialWorkflow);
}
