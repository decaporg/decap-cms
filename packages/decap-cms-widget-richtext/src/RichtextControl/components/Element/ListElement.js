import React from 'react';
import styled from '@emotion/styled';
import { PlateElement } from 'platejs/react';

const bottomMargin = '16px';

const StyledList = styled.li`
  margin-bottom: ${bottomMargin};
  padding-left: 30px;
`;

const StyledListElement = styled.ul`
  margin-top: 8px;
  margin-bottom: 8px;
`;

function ListElement({ children, variant, ...props }) {
  const Element = variant == 'li' ? StyledListElement : StyledList;

  return (
    <PlateElement asChild {...props}>
      <Element variant={variant} as={variant} {...props}>
        {children}
      </Element>
    </PlateElement>
  );
}

export default ListElement;
