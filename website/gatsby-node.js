const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');

exports.createPages = async ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators;

  const docPage = path.resolve('./src/templates/doc-page.js');

  // get all markdown with a frontmatter path field and title
  const allMarkdown = await graphql(`
    {
      allMarkdownRemark(filter: { frontmatter: { title: { ne: null } } }) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
            }
          }
        }
      }
    }
  `);

  if (allMarkdown.errors) {
    console.error(allMarkdown.errors);
    throw Error(allMarkdown.errors);
  }

  allMarkdown.data.allMarkdownRemark.edges.forEach(({ node }) => {
    const { slug } = node.fields;

    createPage({
      path: slug,
      component: docPage,
      context: {
        slug
      }
    });
  });
};

// nodes are created via source filesystem plugin
exports.onCreateNode = ({ node, boundActionCreators, getNode }) => {
  const { createNodeField } = boundActionCreators;

  // adds the slug field so it can be used in createPages
  if (node.internal.type === 'MarkdownRemark') {
    const value = createFilePath({ node, getNode });
    const { relativePath } = getNode(node.parent);

    // used for doc posts
    createNodeField({
      node,
      name: 'slug',
      value
    });

    // used to create GitHub edit link
    createNodeField({
      node,
      name: 'path',
      value: relativePath
    });
  }
};
