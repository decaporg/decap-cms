import React from 'react';
import { PlateElement } from 'platejs/react';
import { useLink } from '@platejs/link/react';

function LinkElement({ children, element, ...rest }) {
  const { props: linkProps } = useLink({ element });
  return (
    <PlateElement
      as="a"
      element={element}
      style={{
        textDecoration: 'underline',
        fontSize: 'inherit',
        maxWidth: '100%',
        fontWeight: 'inherit',
      }}
      {...linkProps}
      {...rest}
    >
      {children}
    </PlateElement>
  );
}

export default LinkElement;
