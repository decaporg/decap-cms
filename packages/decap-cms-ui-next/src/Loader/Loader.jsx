import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
import { CSSTransition } from 'react-transition-group';

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
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  padding-top: 2.75rem;
  margin: 0;

  text-align: center;
  width: auto;
  height: auto;
  z-index: 1000;
  transform: translateX(-50%) translateY(-50%);

  &:before,
  &:after {
    content: '';
    position: absolute;
    top: 0%;
    left: 50%;
    width: 2.2857rem;
    height: 2.2857rem;
    margin: 0 0 0 -1.1429rem;
    border-radius: 500rem;
    border-style: solid;
    border-width: 0.2em;
  }

  /* Static Shape */
  &:before {
    border-color: ${({ theme }) => theme.color.neutral[theme.darkMode ? 1300 : 300]};
  }

  /* Active Shape */
  &:after {
    animation: ${animations.loader} 0.6s linear;
    animation-iteration-count: infinite;
    border-color: ${({ theme }) => theme.color.primary[900]} transparent transparent;
    box-shadow: 0 0 0 1px transparent;
  }
`;

const LoaderItem = styled.div`
  position: absolute;
  white-space: nowrap;
  transform: translateX(-50%);
`;

function Loader({ size = 'md', direction = 'vertical', children }) {
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
      <LoaderWrap role="status" size={size} direction={direction}>
        {children}
      </LoaderWrap>
    );
  } else if (Array.isArray(children)) {
    setAnimation();

    return (
      <LoaderWrap role="status" size={size} direction={direction}>
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
