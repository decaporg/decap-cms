import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

class DashboardPage extends React.Component {
  render() {
    const { collections } = this.props;

    return <div>
      <h1>Dashboard</h1>
      {collections && collections.map((collection) => (
        <div key={collection.get('name')}>
          <Link to={`/collections/${collection.get('name')}`}>{collection.get('name')}</Link>
        </div>
      )).toArray()}
    </div>;
  }
}

function mapStateToProps(state) {
  return {
    collections: state.collections
  };
}

export default connect(mapStateToProps)(DashboardPage);
