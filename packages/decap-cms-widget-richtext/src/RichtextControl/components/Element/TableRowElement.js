function TableRowElement({ children, attributes, nodeProps }) {
  return (
    <tr {...attributes} {...nodeProps}>
      {children}
    </tr>
  );
}

export default TableRowElement;
