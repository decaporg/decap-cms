import React from 'react';
import Helmet from 'react-helmet';
import classnames from 'classnames';

import Header from '../components/header';
import Footer from '../components/footer';

import '../css/main.css';

const Layout = ({ data, location, children }) => {
  const { title, description } = data.site.siteMetadata;
  return (
    <div>
      <Helmet defaultTitle={title} titleTemplate={`%s | ${title}`}>
        <meta name="description" content={description} />
      </Helmet>
      {data.notifs &&
        data.notifs.edges.map(({ node }) => (
          <a
            href={node.url}
            key={node.title}
            className={classnames('notification', {
              'notification-loud': node.loud
            })}
          >
            {node.message}
          </a>
        ))}
      <Header location={location} />
      {children()}
      <Footer buttons={data.dataYaml.footer.buttons} />
    </div>
  );
};

export const pageQuery = graphql`
  query layoutQuery {
    site {
      siteMetadata {
        title
        description
      }
    }
    dataYaml(id: { regex: "/global/" }) {
      footer {
        buttons {
          url
          name
        }
      }
    }
    notifs: allNotificationsYaml(filter: { published: { eq: true } }) {
      edges {
        node {
          loud
          message
          url
        }
      }
    }
  }
`;

export default Layout;
