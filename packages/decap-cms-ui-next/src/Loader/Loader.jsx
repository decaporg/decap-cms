import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
import { CSSTransition } from 'react-transition-group';

import Icon from '../Icon';

const styles = {
  disabled: css`
    display: none;
  `,
  active: css`
    display: block;
  `,
  enter: css`
    opacity: 0.01;
  `,
  enterActive: css`
    opacity: 1;
    transition: opacity 500ms ease-in;
  `,
  exit: css`
    opacity: 1;
  `,
  exitActive: css`
    opacity: 0.01;
    transition: opacity 300ms ease-in;
  `,
};

const animations = {
  loader: keyframes`
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  `,
};

const LoaderWrap = styled.div`
  display: flex;
  flex-direction: ${({ direction }) => (direction === 'horizontal' ? 'row' : 'column')};
  align-items: center;

  z-index: 1000;
`;

const LoaderSpinner = styled(Icon)`
  color: ${({ theme }) => theme.color.primary[theme.darkMode ? 1300 : 300]};
  animation: ${animations.loader} 0.6s linear infinite;
`;

const LoaderItem = styled.div`
  position: relative;
  white-space: nowrap;
`;

function Loader({ size = 'lg', direction = 'vertical', children, ...props }) {
  const [currentItem, setCurrentItem] = useState(0);

  function setAnimation() {
    const interval = setInterval(() => {
      const nextItem = currentItem === children.length - 1 ? 0 : currentItem + 1;
      setCurrentItem(nextItem);
    }, 5000);

    return () => clearInterval(interval);
  }

  if (!children) {
    return null;
  } else if (typeof children === 'string') {
    return (
      <LoaderWrap role="status" size={size} direction={direction} {...props}>
        <LoaderSpinner name="loader-circle" size={size} />

        {children}
      </LoaderWrap>
    );
  } else if (Array.isArray(children)) {
    setAnimation();

    return (
      <LoaderWrap role="status" size={size} direction={direction} {...props}>
        <CSSTransition
          className={{
            enter: styles.enter,
            enterActive: styles.enterActive,
            exit: styles.exit,
            exitActive: styles.exitActive,
          }}
          timeout={500}
        >
          <LoaderItem key={currentItem}>{children[currentItem]}</LoaderItem>
        </CSSTransition>
      </LoaderWrap>
    );
  }
}

Loader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  direction: PropTypes.oneOf(['vertical', 'horizontal']),
  children: PropTypes.node,
};

export default Loader;
