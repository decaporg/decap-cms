import React, { Fragment } from 'react';
import Helmet from 'react-helmet';
import { graphql, StaticQuery } from 'gatsby';

import Header from './header';
import Footer from './footer';
import Notification from './notification';

import '../css/imports/base.css';
import '../css/imports/utilities.css';
import '../css/imports/chat.css';

const Layout = ({ children }) => {
  return (
    <StaticQuery
      query={graphql`
        query layoutQuery {
          site {
            siteMetadata {
              title
              description
            }
          }
          footer: file(relativePath: { regex: "/global/" }) {
            childDataYaml {
              footer {
                buttons {
                  url
                  name
                }
              }
            }
          }
          notifs: file(relativePath: { regex: "/notifications/" }) {
            childDataYaml {
              notifications {
                published
                loud
                message
                url
              }
            }
          }
        }
      `}
    >
      {data => {
        const { title, description } = data.site.siteMetadata;
        const notifs = data.notifs.childDataYaml.notifications.filter(notif => notif.published);

        return (
          <Fragment>
            <Helmet defaultTitle={title} titleTemplate={`%s | ${title}`}>
              <meta name="description" content={description} />
            </Helmet>
            {notifs.map((node, i) => (
              <Notification key={i} url={node.url} loud={node.loud}>
                {node.message}
              </Notification>
            ))}
            <Header notifications={notifs} />
            {children}
            <Footer buttons={data.footer.childDataYaml.footer.buttons} />
          </Fragment>
        );
      }}
    </StaticQuery>
  );
};

export default Layout;
