import React from 'react';
// gatsby throws some error when importing just react-sidecar.
// Maybe because jsx file ext?
import Gitter from 'react-sidecar/dist-modules/index.js';

class HTML extends React.Component {
  render() {
    return (
      <html {...this.props.htmlAttributes}>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="apple-touch-icon" sizes="180x180" href="/img/favicon/apple-touch-icon.png" />
          <link rel="icon" type="image/png" href="/img/favicon/favicon-32x32.png" sizes="32x32" />
          <link rel="icon" type="image/png" href="/img/favicon/favicon-16x16.png" sizes="16x16" />
          <link rel="mask-icon" href="/img/favicon/safari-pinned-tab.svg" color="#96cf05" />
          <meta name="apple-mobile-web-app-title" content="NetlifyCMS" />
          <meta name="application-name" content="NetlifyCMS" />
          {this.props.headComponents}
          <link
            rel="stylesheet"
            href="https://unpkg.com/docsearch.js@2.5.2/dist/cdn/docsearch.min.css"
          />
        </head>
        <body {...this.props.bodyAttributes}>
          {this.props.preBodyComponents}
          <div key={'body'} id="___gatsby" dangerouslySetInnerHTML={{ __html: this.props.body }} />
          {this.props.postBodyComponents}
          <Gitter room="netlify/NetlifyCMS" />
          <script src="//unpkg.com/docsearch.js@2.4.1/dist/cdn/docsearch.min.js" />
        </body>
      </html>
    );
  }
}

export default HTML;
