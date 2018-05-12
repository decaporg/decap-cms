const pkg = require('./package.json');

const cssImport = require('postcss-import');
const neatgrid = require('postcss-neat');
const nestedcss = require('postcss-nested');
const colorfunctions = require('postcss-colour-functions');
const hdBackgrounds = require('postcss-at2x');
const cssextend = require('postcss-simple-extend');
const cssvars = require('postcss-simple-vars-async');

const styleVariables = require('./src/theme');

const postCssPlugins = [
  cssImport({ from: './src/css/main.css' }),
  neatgrid(),
  nestedcss(),
  colorfunctions(),
  hdBackgrounds(),
  cssextend(),
  cssvars({ variables: styleVariables })
];

module.exports = {
  siteMetadata: {
    title: 'Netlify CMS | Open-Source Content Management System',
    description: 'Open source content management for your Git workflow',
    siteUrl: pkg.homepage
  },
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/content`,
        name: 'content'
      }
    },
    'gatsby-transformer-yaml',
    'gatsby-transformer-json',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/data`,
        name: 'data'
      }
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          'gatsby-remark-autolink-headers',
          // {
          //   resolve: `gatsby-remark-images`,
          //   options: {
          //     maxWidth: 590
          //   }
          // },
          // {
          //   resolve: `gatsby-remark-responsive-iframe`,
          //   options: {
          //     wrapperStyle: `margin-bottom: 1.0725rem`
          //   }
          // },
          'gatsby-remark-prismjs'
          // 'gatsby-remark-copy-linked-files',
          // 'gatsby-remark-smartypants'
        ]
      }
    },
    {
      resolve: 'gatsby-plugin-postcss-sass',
      options: {
        postCssPlugins
      }
    },
    // `gatsby-transformer-sharp`,
    // `gatsby-plugin-sharp`,
    // `gatsby-plugin-feed`,
    // `gatsby-plugin-offline`,
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-react-next',
    'gatsby-plugin-catch-links'
  ]
};
