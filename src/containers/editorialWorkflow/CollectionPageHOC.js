import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { OrderedMap } from 'immutable';
import { loadUnpublishedEntries, updateUnpublishedEntryStatus, publishUnpublishedEntry } from '../../actions/editorialWorkflow';
import { selectUnpublishedEntries } from '../../reducers';
import { EDITORIAL_WORKFLOW, status } from '../../constants/publishModes';
import UnpublishedListing from '../../components/UnpublishedListing';
import { connect } from 'react-redux';
import styles from '../CollectionPage.css';

export default function CollectionPageHOC(CollectionPage) {
  class CollectionPageHOC extends CollectionPage {
    static propTypes = {
      dispatch: PropTypes.func.isRequired,
      isEditorialWorkflow: PropTypes.bool.isRequired,
      unpublishedEntries: ImmutablePropTypes.map,
    };

    componentDidMount() {
      const { dispatch, isEditorialWorkflow } = this.props;
      if (isEditorialWorkflow) {
        dispatch(loadUnpublishedEntries());
      }
      super.componentDidMount();
    }

    render() {
      const { isEditorialWorkflow, unpublishedEntries, updateUnpublishedEntryStatus, publishUnpublishedEntry } = this.props;
      if (!isEditorialWorkflow) return super.render();

      return (
        <div>
          <div className={styles.root}>
            <UnpublishedListing
              entries={unpublishedEntries}
              handleChangeStatus={updateUnpublishedEntryStatus}
              handlePublish={publishUnpublishedEntry}
            />
          </div>
          {super.render()}
        </div>
      );
    }
  }

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

  return connect(mapStateToProps, {
    updateUnpublishedEntryStatus,
    publishUnpublishedEntry,
  })(CollectionPageHOC);
}
