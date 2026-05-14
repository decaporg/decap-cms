import React from 'react';
import styled from '@emotion/styled';

const StyledTd = styled.td`
  border: 1px solid black;
  padding: 8px;
  text-align: left;
`;

function TableCellElement({ children, attributes, nodeProps }) {
  return (
    <StyledTd {...attributes} {...nodeProps}>
      {children}
    </StyledTd>
  );
}

export default TableCellElement;
