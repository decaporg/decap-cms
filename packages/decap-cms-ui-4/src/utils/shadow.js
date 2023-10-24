// Usage
// themes.shadow({ size: "lg", direction: "down", inset: false })

const shadow = ({ size = 'md', direction = 'down', inset = false, theme }) => {
  const darkMode = theme && theme.darkMode;
  const proximateShadow = {
    distance: `${direction === 'up' || direction === 'left' ? `-` : ``}${
      size === 'xs' ? `1` : size === 'sm' ? `2` : size === 'md' ? `4` : size === 'lg' ? `8` : `0`
    }px`,
    blur: `${
      size === 'xs' ? `2` : size === 'sm' ? `4` : size === 'md' ? `8` : size === 'lg' ? `16` : `0`
    }px`,
    spread: `${
      size === 'xs' ? `0` : size === 'sm' ? `1` : size === 'md' ? `2` : size === 'lg' ? `4` : `0`
    }px`,
    color: darkMode ? `rgba(0, 0, 0, 0.25)` : `rgba(121, 130, 145, 0.15)`,
  };
  const ambientShadow = {
    distance: `${direction === 'up' || direction === 'left' ? `-` : ``}${
      size === 'xs' ? `4` : size === 'sm' ? `8` : size === 'md' ? `16` : size === 'lg' ? `32` : `0`
    }px`,
    blur: `${
      size === 'xs' ? `8` : size === 'sm' ? `16` : size === 'md' ? `32` : size === 'lg' ? `64` : `0`
    }px`,
    spread: `-${
      size === 'xs' ? `2` : size === 'sm' ? `4` : size === 'md' ? `8` : size === 'lg' ? `16` : `0`
    }px`,
    color: darkMode ? `rgba(0, 0, 0, 0.25)` : `rgba(121, 130, 145, 0.15)`,
  };

  return `${inset ? `inset` : ``} ${
    direction === 'left' || direction === 'right' ? proximateShadow.distance : 0
  } ${direction === 'up' || direction === 'down' ? proximateShadow.distance : 0} ${
    proximateShadow.blur
  } ${proximateShadow.spread} ${proximateShadow.color}, ${inset ? `inset` : ``} ${
    direction === 'left' || direction === 'right' ? ambientShadow.distance : 0
  } ${direction === 'up' || direction === 'down' ? ambientShadow.distance : 0} ${
    ambientShadow.blur
  } ${ambientShadow.spread} ${ambientShadow.color}`;
};

export default shadow;
