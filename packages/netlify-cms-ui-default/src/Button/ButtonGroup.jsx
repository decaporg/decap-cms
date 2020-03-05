import styled from '@emotion/styled';

const ButtonGroup = styled.div`
  margin: -4px;
  display: inline-flex;
  align-items: ${({ direction }) => (direction === 'vertical' ? 'stretch' : 'center')};
  flex-wrap: wrap;
  ${({ direction }) => (direction === 'vertical' ? `flex-direction: column;` : ``)}
  & > * {
    margin: 4px;
  }
`;

export default ButtonGroup;
