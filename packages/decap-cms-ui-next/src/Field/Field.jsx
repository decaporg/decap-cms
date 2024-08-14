import React, { createContext, useContext } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

import Label from '../Label';
import { Badge } from '../Badge';
import Icon from '../Icon';
import { IconButton } from '../Buttons';

export const FieldContext = createContext();

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
  ${({ filled }) =>
    filled
      ? css`
          padding: 0 1rem;
        `
      : ``}
  position: relative;
  ${({ theme, noBorder, filled, error, focus, clickable }) =>
    filled && !noBorder
      ? css`
          box-shadow: inset 0 -1px 0 0 ${error ? theme.color.danger[900] : theme.color.border};
          transition: box-shadow 0.2s;
          ${clickable && !error && !focus
            ? css`
                &:hover {
                  box-shadow: inset 0 -1px 0 0 ${theme.color.borderHover};
                }
              `
            : ``}
        `
      : ``}
  &:hover ${FocusIndicator} {
    height: 2px;
  }
`;

const FieldInside = styled.div`
  ${({ inline }) =>
    inline
      ? css`
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        `
      : ``}
  ${({ clickable }) =>
    clickable
      ? css`
          cursor: pointer;
        `
      : ``}
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  ${({ filled, focus, theme, error, icon, clickable }) =>
    filled
      ? css`
          padding: 1rem 0;
        `
      : css`
          padding: 1rem;
          ${icon ? `padding-right: 3rem;` : ``}
          box-shadow: inset 0 0 0 ${focus ? 2 : 1}px ${error
            ? theme.color.danger['900']
            : focus
            ? theme.color.primary['900']
            : theme.color.border};
          border-radius: 8px;
          transition: 0.2s;
          ${clickable && !error && !focus
            ? css`
                &:hover {
                  box-shadow: inset 0 0 0 1px ${theme.color.borderHover};
                }
              `
            : ``}
        `}
`;

const ChildrenWrap = styled.div`
  position: relative;
`;

const StyledLabel = styled(Label)`
  font-family: ${({ theme }) => theme.fontFamily};
  ${({ inline }) => (inline ? `flex: 1; margin: 0;` : ``)}
  ${({ clickable }) => (clickable ? `cursor: pointer;` : ``)};
  ${({ theme, error }) => (error ? `color: ${theme.color.danger['900']};` : ``)};

  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledIconButton = styled(IconButton)`
  position: absolute;
  right: ${({ filled }) => (filled ? 0 : 0.5)}rem;
  top: 1.85rem;
`;

const StyledDescription = styled.p`
  font-size: 12px;
  margin-top: 0.75rem;
  margin-bottom: 0;

  flex-basis: 100%;
`;

const StyledErrorsList = styled.ul`
  ${({ icon }) =>
    icon &&
    css`
      position: absolute;
      right: 0.5rem;
    `}

  flex: 1;
  justify-content: flex-end;

  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25rem;

  margin-bottom: 0;
  padding-left: 0;
  ${({ inline }) =>
    inline
      ? css`
          padding-right: 0.5rem;
        `
      : ``}
  list-style-type: none;

  color: ${({ theme }) => theme.color.danger['900']};

  li {
    display: flex;
    align-items: center;
    gap: 0.25rem;

    font-size: 12px;
    font-weight: bolder;
  }
`;

function Field({
  focus,
  filled,
  labelTarget,
  label,
  description,
  status,
  children,
  inline,
  onClick,
  className,
  noBorder,
  insideStyle,
  error,
  errors,
  icon,
  clickable,
}) {
  const contextValue = {
    focus,
    filled,
    labelTarget,
    label,
    inline,
    onClick,
    className,
    noBorder,
    insideStyle,
    error,
    icon,
    clickable,
  };

  return (
    <FieldContext.Provider value={contextValue}>
      <FieldWrap
        focus={focus}
        inline={inline}
        filled={filled}
        className={className}
        noBorder={noBorder}
        error={error}
        clickable={clickable || !!onClick}
      >
        <FieldInside
          focus={focus}
          inline={inline}
          filled={filled}
          onClick={onClick}
          style={insideStyle}
          error={error}
          icon={icon}
          clickable={clickable || !!onClick}
        >
          <StyledLabel
            inline={inline}
            filled={filled}
            htmlFor={labelTarget}
            focus={focus}
            clickable={clickable || !!onClick}
            error={error}
          >
            {label} {status && <Badge color={error ? 'danger' : 'neutral'}>{status}</Badge>}
            {error && errors && (
              <StyledErrorsList inline={inline} icon={icon}>
                <Icon name="alert-triangle" />

                {errors.map(
                  error =>
                    error.message &&
                    typeof error.message === 'string' && (
                      <li key={error.message.trim().replace(/[^a-z0-9]+/gi, '-')}>
                        {error.message}
                      </li>
                    ),
                )}
              </StyledErrorsList>
            )}
          </StyledLabel>

          <ChildrenWrap>{children}</ChildrenWrap>

          {icon && React.isValidElement(icon)
            ? icon
            : icon && <StyledIconButton icon={icon || null} active={focus} filled={filled} />}

          {description && <StyledDescription>{description}</StyledDescription>}
        </FieldInside>

        {!noBorder && filled && <FocusIndicator focus={focus} error={error} />}
      </FieldWrap>
    </FieldContext.Provider>
  );
}

export function useFieldContext() {
  return useContext(FieldContext);
}

export function withFieldContext(Component) {
  return props => (
    <FieldContext.Consumer>
      {context => <Component {...props} {...context} />}
    </FieldContext.Consumer>
  );
}

export default withFieldContext(Field);
