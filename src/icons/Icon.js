import React from 'react';
import iconAdd from './icon-add.svg';
import iconCircle from './icon-circle.svg';
import iconFolder from './icon-folder.svg';
import iconGrid from './icon-grid.svg';
import iconHome from './icon-home.svg';
import iconList from './icon-list.svg';
import iconMedia from './icon-media.svg';
import iconMediaAlt from './icon-media-alt.svg';
import iconPage from './icon-page.svg';
import iconPages from './icon-pages.svg';
import iconPagesAlt from './icon-pages-alt.svg';
import iconSettings from './icon-settings.svg';
import iconWorkflow from './icon-workflow.svg';
import iconWrite from './icon-write.svg';

const svgIcons = {
  'add': iconAdd,
  'circle': iconCircle,
  'folder': iconFolder,
  'grid': iconGrid,
  'home': iconHome,
  'list': iconList,
  'media': iconMedia,
  'media-alt': iconMediaAlt,
  'page': iconPage,
  'pages': iconPages,
  'pages-alt': iconPagesAlt,
  'settings': iconSettings,
  'workflow': iconWorkflow,
  'write': iconWrite,
};

const Icon = props => {
  const { type, className = '', ...remainingProps } = props;
  return (
    <span
      dangerouslySetInnerHTML={{ __html: svgIcons[type] }}
      className={`nc-icon ${className}`}
      {...remainingProps}
    ></span>
  );
}

export default Icon;
