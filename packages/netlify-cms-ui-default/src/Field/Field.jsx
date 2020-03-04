import React from 'react';
import styled from '@emotion/styled';
import Label from '../Label';

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
  padding: 1rem;
  position: relative;
  box-shadow: ${({ theme, noBorder }) =>
    noBorder ? `` : `inset 0 -1px 0 0 ${theme.color.border}`};
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
`;

const StyledLabel = styled(Label)`
  font-family: ${({ theme }) => theme.fontFamily};
  ${({ control }) => (control ? `flex: 1; margin: 0;` : ``)}
  ${({ clickable }) => (clickable ? `cursor: pointer;` : ``)};
`;

const Field = ({ focus, labelTarget, label, children, control, onClick, className, noBorder }) => (
  <FieldWrap focus={focus} control={control} className={className} noBorder={noBorder}>
    <FieldInside focus={focus} control={control} onClick={onClick} clickable={!!onClick}>
      <StyledLabel control={control} htmlFor={labelTarget} focus={focus} clickable={!!onClick}>
        {label}
      </StyledLabel>
      {children}
    </FieldInside>
    {!noBorder && <FocusIndicator focus={focus} />}
  </FieldWrap>
);

export default Field;
