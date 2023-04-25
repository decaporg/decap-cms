import React from 'react';

import ChatButton from './components/chat-button';

class HTML extends React.Component {
  render() {
    return (
      <html {...this.props.htmlAttributes}>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="apple-mobile-web-app-title" content="Decap CMS" />
          <meta name="application-name" content="Decap CMS" />
          <meta property="og:image" content="https://decapcms.org/img/og-image.jpg" />

          <link rel="icon" type="image/png" href="/img/favicon/favicon-32x32.png" sizes="32x32" />
          <link rel="icon" type="image/png" href="/img/favicon/favicon-16x16.png" sizes="16x16" />
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
          <ChatButton />
          <script src="//unpkg.com/docsearch.js@2.4.1/dist/cdn/docsearch.min.js" />
        </body>
      </html>
    );
  }
}

export default HTML;
