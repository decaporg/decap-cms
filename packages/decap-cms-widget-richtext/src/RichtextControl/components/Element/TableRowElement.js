import React from 'react';

function TableRowElement({ children, attributes, nodeProps }) {
  return (
    <tr {...attributes} {...nodeProps}>
      {children}
    </tr>
  );
}

export default TableRowElement;
