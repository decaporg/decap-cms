import React from 'react';
import styled from '@emotion/styled';
import Label from '../Label';
import { IconButton } from '../Button';

export const FieldContext = React.createContext();

const FocusIndicator = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${({ focus }) => (focus ? 2 : 1)}px;
  background-color: ${({ theme, error }) =>
    error ? theme.color.danger[900] : theme.color.primary[900]};
  transition: 0.2s;
  transform: scaleX(${({ focus }) => (focus ? 1 : 0)});
  backface-visibility: hidden;
`;
const FieldWrap = styled.div`
  ${({ inline }) =>
    inline
      ? `
    padding: 0 1rem;
      `
      : ``}
  position: relative;
  ${({ theme, noBorder, inline, error, focus, clickable }) =>
    inline && !noBorder
      ? `
        box-shadow: inset 0 -1px 0 0 ${error ? theme.color.danger[900] : theme.color.border};
        transition: box-shadow 0.2s;
        ${
          clickable && !error && !focus
            ? `
      &:hover {
        box-shadow: inset 0 -1px 0 0 ${theme.color.borderHover};
      }
    `
            : ``
        }
      `
      : ``}
  &:hover ${FocusIndicator} {
    height: 2px;
  }
`;
const FieldInside = styled.div`
  ${({ control }) => (control ? `display: flex; align-items: center;` : ``)}
  ${({ clickable }) => (clickable ? `cursor: pointer;` : ``)}
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  ${({ inline, focus, theme, error, icon, clickable }) =>
    inline
      ? `padding: 1rem 0;`
      : `
    padding: 1rem;
    ${icon ? `padding-right: 3rem;` : ``}
    box-shadow: inset 0 0 0 ${focus ? 2 : 1}px ${
          error
            ? theme.color.danger['900']
            : focus
            ? theme.color.primary['900']
            : theme.color.border
        };
    border-radius: 8px;
    transition: 0.2s;
    ${
      clickable && !error && !focus
        ? `
      &:hover {
        box-shadow: inset 0 0 0 1px ${theme.color.borderHover};
      }
    `
        : ``
    }
  `}
`;
const ChildrenWrap = styled.div`
  position: relative;
`;
const StyledLabel = styled(Label)`
  font-family: ${({ theme }) => theme.fontFamily};
  ${({ control }) => (control ? `flex: 1; margin: 0;` : ``)}
  ${({ clickable }) => (clickable ? `cursor: pointer;` : ``)};
  ${({ theme, error }) => (error ? `color: ${theme.color.danger['900']};` : ``)};
`;
const StyledIconButton = styled(IconButton)`
  position: absolute;
  right: ${({ inline }) => (inline ? 0 : 0.5)}rem;
  bottom: 0.5rem;
`;

const Field = ({
  focus,
  inline,
  labelTarget,
  label,
  children,
  control,
  onClick,
  className,
  noBorder,
  insideStyle,
  error,
  icon,
  clickable,
}) => (
  <FieldWrap
    focus={focus}
    control={control}
    inline={inline}
    className={className}
    noBorder={noBorder}
    error={error}
    clickable={clickable || !!onClick}
  >
    <FieldInside
      focus={focus}
      control={control}
      inline={inline}
      onClick={onClick}
      style={insideStyle}
      error={error}
      icon={icon}
      clickable={clickable || !!onClick}
    >
      <StyledLabel
        control={control}
        inline={inline}
        htmlFor={labelTarget}
        focus={focus}
        clickable={clickable || !!onClick}
        error={error}
      >
        {label}
      </StyledLabel>
      <ChildrenWrap>{children}</ChildrenWrap>
      {icon && <StyledIconButton icon={icon} active={focus} inline={inline} />}
    </FieldInside>
    {!noBorder && inline && <FocusIndicator focus={focus} error={error} />}
  </FieldWrap>
);

export const withFieldContext = Component => props => (
  <FieldContext.Consumer>{context => <Component {...props} {...context} />}</FieldContext.Consumer>
);

export default withFieldContext(Field);
