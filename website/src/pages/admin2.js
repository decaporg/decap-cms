import React, { Fragment, Component } from 'react';
import Helmet from 'react-helmet';

let CMS;

class AdminPage2 extends Component {
  componentWillMount() {
    const { init, default: CMSImport } = require("netlify-cms-node");
    CMS = CMSImport;
    init();
  }

  render() {
    return (
      <Fragment>
        <div id="nc-root" key="cms" />
      </Fragment>
    );
  }
};

export default AdminPage2;
