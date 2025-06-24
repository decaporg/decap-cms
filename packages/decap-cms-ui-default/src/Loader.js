import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
import { CSSTransition } from 'react-transition-group';

import { colors, zIndex } from './styles';

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

const LoaderText = styled.div`
  width: auto !important;
  height: auto !important;
  text-align: center;
  color: #767676;
  margin-top: 55px;
  line-height: 35px;
`;

const LoaderItem = styled.div`
  position: absolute;
  white-space: nowrap;
  transform: translateX(-50%);
`;

export class Loader extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
  };

  state = {
    currentItem: 0,
  };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(Loader.propTypes, this.props, 'prop', 'Loader');
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  setAnimation = () => {
    if (this.interval) return;
    const { children } = this.props;

    this.interval = setInterval(() => {
      const nextItem =
        this.state.currentItem === children.length - 1 ? 0 : this.state.currentItem + 1;
      this.setState({ currentItem: nextItem });
    }, 5000);
  };

  renderChild = () => {
    const { children } = this.props;
    const { currentItem } = this.state;
    if (!children) {
      return null;
    } else if (typeof children == 'string') {
      return <LoaderText>{children}</LoaderText>;
    } else if (Array.isArray(children)) {
      this.setAnimation();
      return (
        <LoaderText>
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
        </LoaderText>
      );
    }
  };

  render() {
    const { className } = this.props;
    return <div className={className}>{this.renderChild()}</div>;
  }
}

const StyledLoader = styled(Loader)`
  display: ${props => (props.active ? 'block' : 'none')};
  position: absolute;
  top: 50%;
  left: 50%;
  margin: 0;
  text-align: center;
  z-index: ${zIndex.zIndex1000};
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
    border-color: rgba(0, 0, 0, 0.1);
  }

  /* Active Shape */
  &:after {
    animation: ${animations.loader} 0.6s linear;
    animation-iteration-count: infinite;
    border-color: ${colors.active} transparent transparent;
    box-shadow: 0 0 0 1px transparent;
  }
`;

export default StyledLoader;
