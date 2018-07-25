import React from 'react';
import Gitter from 'react-sidecar';

let stylesStr;
if (process.env.NODE_ENV === `production`) {
  try {
    stylesStr = require('!raw-loader!../public/styles.css');
  } catch (e) {
    console.log(e);
  }
}

const JS_NPM_URLS = [
  'https://buttons.github.io/buttons.js',
  '//unpkg.com/docsearch.js@2.4.1/dist/cdn/docsearch.min.js'
];

module.exports = class HTML extends React.Component {
  render() {
    let css;
    if (process.env.NODE_ENV === 'production') {
      css = (
        <style
          id="gatsby-inlined-css"
          dangerouslySetInnerHTML={{ __html: stylesStr }}
        />
      );
    }

    const js = JS_NPM_URLS.map(src => <script key={src} src={src} />);

    return (
      <html {...this.props.htmlAttributes}>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/img/favicon/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            href="/img/favicon/favicon-32x32.png"
            sizes="32x32"
          />
          <link
            rel="icon"
            type="image/png"
            href="/img/favicon/favicon-16x16.png"
            sizes="16x16"
          />
          <link
            rel="mask-icon"
            href="/img/favicon/safari-pinned-tab.svg"
            color="#96cf05"
          />
          <meta name="apple-mobile-web-app-title" content="NetlifyCMS" />
          <meta name="application-name" content="NetlifyCMS" />
          {this.props.headComponents}
          {css}
          <link
            rel="stylesheet"
            href="https://unpkg.com/docsearch.js@2.5.2/dist/cdn/docsearch.min.css"
          />
        </head>
        <body {...this.props.bodyAttributes}>
          {this.props.preBodyComponents}
          <div
            key={'body'}
            id="___gatsby"
            dangerouslySetInnerHTML={{ __html: this.props.body }}
          />
          {this.props.postBodyComponents}
          <Gitter room="netlify/NetlifyCMS" />
          {js}
        </body>
      </html>
    );
  }
};
