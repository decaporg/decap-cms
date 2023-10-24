import styled from '@emotion/styled';

const NavMenuGroup = styled.div`
  padding: 0.75rem 0;
  display: flex;
  flex-direction: column;
  &:first-child {
    padding-top: 0;
  }
  ${({ end }) =>
    end
      ? `
    flex: 1;
    justify-content: flex-end;
    padding-bottom: 0;
  `
      : ``}
  &:not(:first-child):not(:last-child) {
    /* border-top: 1px solid ${({ theme }) => theme.color.border}; */
  }
`;

export default NavMenuGroup;
