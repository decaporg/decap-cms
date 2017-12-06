import PropTypes from 'prop-types';
import React from 'react';
import { Card } from "../../components/UI";
import logo from "./netlify_logo.svg";

export default class OfflinePage extends React.Component {
  static propTypes = {
    message: PropTypes.string,
  };

  state = { };

  render() {
    return (<section className="nc-gitGatewayAuthenticationPage-root">
      <Card className="nc-gitGatewayAuthenticationPage-card">
        <img src={logo} width={100} role="presentation" />
        <p className="nc-gitGatewayAuthenticationPage-message">{this.props.message || "Admin is offline"}</p>
      </Card>
    </section>);
  }
}
