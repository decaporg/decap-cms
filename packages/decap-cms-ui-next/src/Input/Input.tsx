import styled from '@emotion/styled';

const Input = styled.input`
  color: ${({ theme }) => theme.color.highEmphasis};
  background: none;
  border: none;
  outline: none;
  width: calc(100% + 32px);
  font-family: inherit;
  font-size: ${({ title }) => (title ? '2rem' : '1rem')};
  font-weight: ${({ title }) => (title ? 'bold' : 'normal')};
  letter-spacing: ${({ title }) => (title ? '-0.5px' : '0')};
  line-height: 1rem;
  caret-color: ${({ theme, error }) =>
    error ? theme.color.danger['900'] : theme.color.primary['800']};
  margin: -2rem -1rem -1rem -1rem;
  padding: 2rem 1rem 1rem 1rem;
  ${({ clickable }) => (clickable ? `cursor: pointer;` : ``)} ::placeholder {
    color: ${({ theme }) => theme.color.disabled};
  }
`;

export default Input;
