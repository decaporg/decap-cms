import React from 'react';

let stylesStr;
if (process.env.NODE_ENV === `production`) {
  try {
    stylesStr = require('!raw-loader!../public/styles.css');
  } catch (e) {
    console.log(e);
  }
}
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
          <link rel="manifest" href="/img/favicon/manifest.json" />
          <link
            rel="mask-icon"
            href="/img/favicon/safari-pinned-tab.svg"
            color="#96cf05"
          />
          <meta name="apple-mobile-web-app-title" content="NetlifyCMS" />
          <meta name="application-name" content="NetlifyCMS" />
          <meta name="theme-color" content="#ffffff" />
          {this.props.headComponents}
          {css}
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/docsearch.js/2/docsearch.min.css"
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
          <script async defer src="https://buttons.github.io/buttons.js" />
        </body>
      </html>
    );
  }
};

/*

{{ if or (eq .Section "docs") (eq .Title "Docs") }}
  <script src="/jquery.scrollTo.min.js"></script>
  <script src="/jquery.localScroll.min.js"></script>
  <script src="/prism.js"></script>
{{ end }}
{{ if eq .Title "Community" }}
  <script src="/moment.min.js"></script>
{{ end }}
<script src="/app.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/docsearch.js/2/docsearch.min.js"></script>
<script type="text/javascript"> docsearch({
apiKey: '08d03dc80862e84c70c5a1e769b13019',
indexName: 'netlifycms',
inputSelector: '.algolia-search',
debug: false // Set debug to true if you want to inspect the dropdown
});
</script>
{{- if eq .Title "Widgets" -}} <!-- Check if is widgets page, if so, add the widget cloud js script -->
  <script src="/widgets.js"></script>
{{- end -}}
<script async defer src="https://buttons.github.io/buttons.js"></script>
{{ if or (eq .Section "docs") (eq .Title "Docs") (eq .Title "Community") }}
<script>
  ((window.gitter = {}).chat = {}).options = {
    room: 'netlify/NetlifyCMS'
  };
</script>
<script src="https://sidecar.gitter.im/dist/sidecar.v1.js" async defer></script>
{{ end }}

*/
