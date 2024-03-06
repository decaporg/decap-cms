import styled from '@emotion/styled';

const Label = styled.label`
  color: ${({ theme, focus }) => (focus ? theme.color.primary['800'] : theme.color.lowEmphasis)};
  font-size: 12px;
  font-weight: bold;
  letter-spacing: -0.5px;
  display: block;
  line-height: 1rem;
  transition: 0.2s;
  margin-top: -0.25rem;
  margin-bottom: 0.25rem;
`;

export default Label;
