import React from 'react';
import { graphql, StaticQuery } from 'gatsby';

import Notification from './notification';

const NOTIFS_QUERY = graphql`
  query notifs {
    file(relativePath: { regex: "/notifications/" }) {
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
`;

const Notifications = () => (
  <StaticQuery query={NOTIFS_QUERY}>
    {data => {
      const notifs = data.file.childDataYaml.notifications.filter(notif => notif.published);
      return notifs.map((node, i) => (
        <Notification key={i} url={node.url} loud={node.loud}>
          {node.message}
        </Notification>
      ));
    }}
  </StaticQuery>
);

export default Notifications;
