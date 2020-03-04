import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import Popover from '../Popover';

const StyledPopover = styled(Popover)`
  pointer-events: none;
`;

const TooltipWrap = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.elevatedSurface};
  background-color: ${({ theme }) => theme.color.mediumEmphasis};
  box-shadow: 0 0 4px 1px
      ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(14, 30, 37, 0.06)')},
    0 8px 16px 0 ${({ theme }) => (theme.darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(14, 30, 37, 0.2)')};
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
`;

const Menu = React.forwardRef(function Menu(props, ref) {
  const {
    children,
    enterDelay = 0,
    leaveDelay = 0,
    transitionDuration = 250,
    anchorOrigin,
    transformOrigin,
    label,
    ...other
  } = props;
  const firstSelectedItemRef = React.useRef(null);
  const firstValidItemRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  let mouseEnterTimeout;
  let mouseLeaveTimeout;

  const getContentAnchorEl = () => firstSelectedItemRef.current || firstValidItemRef.current;

  const handleMouseEnter = () => {
    clearTimeout(mouseLeaveTimeout);
    mouseEnterTimeout = setTimeout(() => setOpen(true), enterDelay);
  };

  const handleMouseLeave = () => {
    clearTimeout(mouseEnterTimeout);
    mouseLeaveTimeout = setTimeout(() => setOpen(false), leaveDelay);
  };

  useEffect(() => {
    const anchorEl = anchorRef.current;

    if (anchorEl) {
      anchorEl.addEventListener('mouseenter', handleMouseEnter);
      anchorEl.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        anchorEl.removeEventListener('mouseenter', handleMouseEnter);
        anchorEl.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return (
    <>
      {React.Children.map(children, element => {
        return React.cloneElement(element, { ref: anchorRef });
      })}
      {label && (
        <StyledPopover
          anchorEl={anchorRef.current}
          getContentAnchorEl={getContentAnchorEl}
          anchorOrigin={anchorOrigin || { y: 'bottom', x: 'center' }}
          transformOrigin={transformOrigin || { y: 'top', x: 'center' }}
          open={open}
          ref={ref}
          transitionDuration={transitionDuration}
          {...other}
        >
          <TooltipWrap>{label}</TooltipWrap>
        </StyledPopover>
      )}
    </>
  );
});

export default Menu;
