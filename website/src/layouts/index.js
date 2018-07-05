import React, { Fragment } from 'react';
import Helmet from 'react-helmet';
import classnames from 'classnames';

import Header from '../components/header';
import Footer from '../components/footer';

import '../css/imports/base.css';
import '../css/imports/utilities.css';
import '../css/imports/gitter.css';

const Layout = ({ data, location, children }) => {
  const { title, description } = data.site.siteMetadata;
  const notifs = data.notifs.notifications.filter(notif => notif.published);

  return (
    <Fragment>
      <Helmet defaultTitle={title} titleTemplate={`%s | ${title}`}>
        <meta name="description" content={description} />
      </Helmet>
      {notifs.map((node, i) => (
        <a
          key={i}
          href={node.url}
          className={classnames('notification', {
            'notification-loud': node.loud
          })}
        >
          {node.message}
        </a>
      ))}
      <Header location={location} notifications={notifs} />
      {children()}
      <Footer buttons={data.dataYaml.footer.buttons} />
    </Fragment>
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
    notifs: dataYaml(id: { regex: "/notifications/" }) {
      notifications {
        published
        loud
        message
        url
      }
    }
  }
`;

export default Layout;
