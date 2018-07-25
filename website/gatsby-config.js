const pkg = require('./package.json');

const neatgrid = require('postcss-neat');
const nestedcss = require('postcss-nested');
const colorfunctions = require('postcss-colour-functions');
const hdBackgrounds = require('postcss-at2x');
const cssextend = require('postcss-simple-extend');
const cssvars = require('postcss-simple-vars-async');

const styleVariables = require('./src/theme');

const postCssPlugins = [
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
    siteUrl: pkg.homepage,
    menu: {
      docs: [
        {
          name: 'start',
          title: 'Quick Start'
        },
        {
          name: 'guides',
          title: 'Guides'
        },
        {
          name: 'reference',
          title: 'Reference'
        },
        {
          name: 'contributing',
          title: 'Contributing'
        }
      ]
    }
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
        // prettier-ignore
        plugins: [
          'gatsby-remark-autolink-headers',
          'gatsby-remark-prismjs'
        ]
      }
    },
    {
      resolve: 'gatsby-plugin-postcss-sass',
      options: {
        postCssPlugins
      }
    },
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-react-next',
    'gatsby-plugin-catch-links',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'NetlifyCMS',
        short_name: 'NetlifyCMS',
        start_url: '/',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        display: 'standalone',
        icon: 'static/img/favicon/icon-512x512.png'
      }
    }
  ]
};
