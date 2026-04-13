import React from 'react';
import { PlateElement, useElement } from 'platejs/react';
import { useLink } from '@platejs/link/react';

function LinkElement({ children, element, ...rest }) {
  const el = useElement();
  const { props: linkProps } = useLink({ element: el });
  return (
    <PlateElement
      as="a"
      element={element}
      style={{ textDecoration: 'underline', fontSize: 'inherit', maxWidth: '100%', fontWeight: 'inherit' }}
      {...linkProps}
      {...rest}
    >
      {children}
    </PlateElement>
  );
}

export default LinkElement;
