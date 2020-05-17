import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import history from 'Routing/history';
import { NavMenu, NavMenuGroup, NavMenuItem } from 'netlify-cms-ui-default';

const Nav = ({ collections, location }) => {
  const [activeItemId, setActiveItemId] = useState();

  useEffect(() => {
    console.log({ location });
    const pathnameArray = location.pathname.split('/');
    let pathname = '';
    if (pathnameArray[1] === 'collections') {
      pathname = `${pathnameArray[1]}-${pathnameArray[2]}`;
    } else {
      pathname = pathnameArray[1];
    }
    console.log({ location, pathnameArray, pathname, activeItemId });
    setActiveItemId(pathname);
  }, [location]);

  return (
    <NavMenu>
      <NavMenuGroup>
        <NavMenuItem active={activeItemId === 'dashboard'} onClick={() => false} icon="layout">
          Dashboard
        </NavMenuItem>
        <NavMenuItem
          active={activeItemId === 'workflow'}
          onClick={() => {
            history.push(`/workflow`);
          }}
          icon="workflow"
        >
          Workflow
        </NavMenuItem>
        <NavMenuItem
          active={activeItemId === 'media'}
          onClick={() => history.push(`/media`)}
          icon="image"
        >
          Media
        </NavMenuItem>
        {collections.toList().map(collection => {
          const collectionName = collection.get('name');
          console.log(collections.toJS());
          return (
            <NavMenuItem
              key={collectionName}
              active={activeItemId === `collections-${collectionName}`}
              onClick={() => history.push(`/collections/${collectionName}`)}
              icon={
                collection.get('icon') || collection.get('type') === 'file_based_collection'
                  ? 'file'
                  : 'folder'
              }
            >
              {collection.get('label')}
            </NavMenuItem>
          );
        })}
      </NavMenuGroup>
      <NavMenuGroup>
        <NavMenuItem href="https://app.netlify.com/my-website/analytics" icon="bar-chart">
          Analytics
        </NavMenuItem>
        <NavMenuItem href="https://app.netlify.com/my-website/" icon="server">
          Netlify
        </NavMenuItem>
        <NavMenuItem href="https://github.com/joebob/my-website" icon="github">
          Github Repository
        </NavMenuItem>
        <NavMenuItem active={activeItemId === 'settings'} onClick={() => false} icon="settings">
          Settings
        </NavMenuItem>
      </NavMenuGroup>
    </NavMenu>
  );
};

export default withRouter(Nav);
