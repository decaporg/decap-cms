import styled from '@emotion/styled';

const NavMenuGroupLabel = styled.div`
  width: 13.5rem;
  min-width: 13.5rem;
  margin-left: 1.125rem;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  line-height: 1rem;
  color: ${({ theme }) => theme.color.lowEmphasis};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: 200ms;
`;

export default NavMenuGroupLabel;
