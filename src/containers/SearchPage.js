import React from 'react';
import { connect } from 'react-redux';

class SearchPage extends React.Component {
  render() {
    return <div>
      <h1>Search</h1>
    </div>;
  }
}

export default connect()(SearchPage);
