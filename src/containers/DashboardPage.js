import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { SIMPLE, EDITORIAL_WORKFLOW } from '../constants/publishModes';
import history from '../routing/history';
import UnpublishedEntriesPanel from './editorialWorkflow/UnpublishedEntriesPanel';
import styles from './breakpoints.css';


class DashboardPage extends Component {
  componentWillMount() {
    if (this.props.publishMode === SIMPLE) {
      history.push(`/collections/${ this.props.firstCollection }`);
    }
  }

  render() {
    return (
      <div className={styles.root}>
        <h1>Dashboard</h1>
        <UnpublishedEntriesPanel />
      </div>
    );
  }
}

DashboardPage.propTypes = {
  firstCollection: PropTypes.string,
  publishMode: PropTypes.oneOf([SIMPLE, EDITORIAL_WORKFLOW]),
};

function mapStateToProps(state) {
  const { config, collections } = state;
  return {
    firstCollection: collections.first().get('name'),
    publishMode: config.get('publish_mode'),
  };
}

export default connect(mapStateToProps)(DashboardPage);
