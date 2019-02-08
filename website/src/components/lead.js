import styled from '@emotion/styled';

const Lead = styled.p`
  font-size: 18px;
  margin-bottom: 24px;

  ${p => p.light && 'color: white;'};
`;

export default Lead;
