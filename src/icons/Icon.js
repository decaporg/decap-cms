import React from 'react';
import iconAdd from './icon-add.svg';
import iconArrow from './icon-arrow.svg';
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
import iconUser from './icon-user.svg';
import iconWorkflow from './icon-workflow.svg';
import iconWrite from './icon-write.svg';

const icons = {
  'add': {
    image: iconAdd,
  },
  'arrow': {
    image: iconArrow,
    direction: 'left',
  },
  'circle': {
    image: iconCircle,
  },
  'folder': {
    image: iconFolder,
  },
  'grid': {
    image: iconGrid,
  },
  'home': {
    image: iconHome,
  },
  'list': {
    image: iconList,
  },
  'media': {
    image: iconMedia,
  },
  'media-alt': {
    image: iconMediaAlt,
  },
  'page': {
    image: iconPage,
  },
  'pages': {
    image: iconPages,
  },
  'pages-alt': {
    image: iconPagesAlt,
  },
  'settings': {
    image: iconSettings,
  },
  'user': {
    image: iconUser,
  },
  'workflow': {
    image: iconWorkflow,
  },
  'write': {
    image: iconWrite,
  },
};

const getRotation = (iconDirection, newDirection) => {
  if (!iconDirection || !newDirection) {
    return '0deg';
  }
  const rotations = { right: 90, down: 180, left: 270, up: 360 };
  const degrees = rotations[newDirection] - rotations[iconDirection];
  return `${degrees}deg`;
}

const Icon = props => {
  const { type, direction, size = 'medium', className = '', ...remainingProps } = props;
  const icon = icons[type];
  const rotation = getRotation(icon.direction, direction)
  const transform = `rotate(${rotation})`;
  const style = { transform };
  return (
    <span
      dangerouslySetInnerHTML={{ __html: icon.image }}
      className={`nc-icon nc-icon-${size} ${className}`}
      style={style}
      {...remainingProps}
    ></span>
  );
}

export default Icon;
