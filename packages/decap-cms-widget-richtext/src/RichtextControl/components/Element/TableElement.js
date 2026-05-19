import React from 'react';
import styled from '@emotion/styled';

const StyledTable = styled.table`
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
`;

function TableElement({ children, attributes, nodeProps }) {
  return (
    <StyledTable {...attributes} {...nodeProps}>
      <tbody>{children}</tbody>
    </StyledTable>
  );
}

export default TableElement;
