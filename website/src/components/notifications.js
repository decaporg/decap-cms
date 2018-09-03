import React, { Fragment } from 'react';
import classnames from 'classnames';
import { graphql, StaticQuery } from 'gatsby';

import '../css/imports/notification.css';

const Notifications = () => (
  <StaticQuery
    query={graphql`
      query notifsQuery {
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
      const notifs = data.notifs.childDataYaml.notifications.filter(notif => notif.published);

      return (
        <Fragment>
          {notifs.map((node, i) => (
            <a
              key={i}
              href={node.url}
              className={classnames('notification', {
                'notification-loud': node.loud,
              })}
            >
              {node.message}
            </a>
          ))}
        </Fragment>
      );
    }}
  </StaticQuery>
);

export default Notifications;
