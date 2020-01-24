const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

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
    console.error(allMarkdown.errors); // eslint-disable-line no-console
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
        slug,
      },
    });
  });
};

const pad = n => (n >= 10 ? n : `0${n}`);

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === 'MarkdownRemark') {
    const value = createFilePath({ node, getNode });
    const { relativePath } = getNode(node.parent);

    let slug = value;

    if (relativePath.includes('blog/')) {
      const date = new Date(node.frontmatter.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const filename = path.basename(relativePath, '.md');
      slug = `/blog/${year}/${pad(month)}/${filename}`;

      createNodeField({
        node,
        name: 'date',
        value: date.toJSON(),
      });
    }

    // used for doc posts
    createNodeField({
      node,
      name: 'slug',
      value: slug,
    });

    // used to create GitHub edit link
    createNodeField({
      node,
      name: 'path',
      value: relativePath,
    });
  }
};
