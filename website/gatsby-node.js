const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');

exports.createPages = async ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators;

  const docPage = path.resolve('./src/templates/doc-page.js');
  const blogPost = path.resolve('./src/templates/blog-post.js');

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

    let template = docPage;

    if (slug.includes('blog/')) {
      template = blogPost;
    }

    createPage({
      path: slug,
      component: template,
      context: {
        slug
      }
    });
  });
};

const BLOG_POST_FILENAME_REGEX = /([0-9]+)\-([0-9]+)\-([0-9]+)\-(.+)\.md$/;

// nodes are created via source filesystem plugin
exports.onCreateNode = ({ node, boundActionCreators, getNode }) => {
  const { createNodeField } = boundActionCreators;

  if (node.internal.type === 'MarkdownRemark') {
    const value = createFilePath({ node, getNode });
    const { relativePath } = getNode(node.parent);

    let slug = value;

    if (relativePath.includes('blog/')) {
      const match = BLOG_POST_FILENAME_REGEX.exec(relativePath);
      const year = match[1];
      const month = match[2];
      const day = match[3];
      const filename = match[4];

      slug = `/blog/${year}/${month}/${day}/${filename}`;
      const date = new Date(year, month - 1, day);

      // Blog posts are sorted by date and display the date in their header.
      createNodeField({
        node,
        name: 'date',
        value: date.toJSON()
      });
    }

    // used for doc posts
    createNodeField({
      node,
      name: 'slug',
      value: slug
    });

    // used to create GitHub edit link
    createNodeField({
      node,
      name: 'path',
      value: relativePath
    });
  }
};
