import React from 'react';
import styled from '@emotion/styled';
import Label from '../Label';

export const FieldContext = React.createContext();

const FocusIndicator = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${({ focus }) => (focus ? 2 : 1)}px;
  background-color: ${({ theme }) => theme.color.primary['400']};
  transition: 0.2s;
  transform: scaleX(${({ focus }) => (focus ? 1 : 0)});
  backface-visibility: hidden;
`;
const FieldWrap = styled.div`
  ${({ inline }) =>
    inline
      ? `
    padding: 1rem;
      `
      : ``}
  position: relative;
  ${({ theme, noBorder, inline }) =>
    inline && !noBorder ? `box-shadow: inset 0 -1px 0 0 ${theme.color.border};` : ``}
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
  ${({ inline, focus, theme }) =>
    inline
      ? ``
      : `
    padding: 1rem;
    box-shadow: inset 0 0 0 ${focus ? 2 : 1}px ${
          focus ? theme.color.primary['500'] : theme.color.border
        };
    border-radius: 8px;
    transition: 0.2s;
  `}
`;
const ChildrenWrap = styled.div`
  position: relative;
`;

const StyledLabel = styled(Label)`
  font-family: ${({ theme }) => theme.fontFamily};
  ${({ control }) => (control ? `flex: 1; margin: 0;` : ``)}
  ${({ clickable }) => (clickable ? `cursor: pointer;` : ``)};
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
}) => (
  <FieldWrap
    focus={focus}
    control={control}
    inline={inline}
    className={className}
    noBorder={noBorder}
  >
    <FieldInside
      focus={focus}
      control={control}
      inline={inline}
      onClick={onClick}
      clickable={!!onClick}
      style={insideStyle}
    >
      <StyledLabel
        control={control}
        inline={inline}
        htmlFor={labelTarget}
        focus={focus}
        clickable={!!onClick}
      >
        {label}
      </StyledLabel>
      <ChildrenWrap>{children}</ChildrenWrap>
    </FieldInside>
    {!noBorder && inline && <FocusIndicator focus={focus} />}
  </FieldWrap>
);

export const withFieldContext = Component => props => (
  <FieldContext.Consumer>{context => <Component {...props} {...context} />}</FieldContext.Consumer>
);

export default withFieldContext(Field);
