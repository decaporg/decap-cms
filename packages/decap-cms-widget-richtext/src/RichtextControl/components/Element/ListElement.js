import React from 'react';
import styled from '@emotion/styled';
import { PlateElement } from '@udecode/plate-common/react';

const bottomMargin = '16px';

const StyledList = styled(PlateElement)`
  margin-bottom: ${bottomMargin};
  padding-left: 30px;
`;

const StyledListElement = styled(PlateElement)`
  margin-top: 8px;
  margin-bottom: 8px;
`;

function ListElement({ children, variant, ...props }) {
  const Element = (variant == 'li' ? StyledListElement : StyledList).withComponent(variant);

  return (
    <Element variant={variant} {...props}>
      {children}
    </Element>
  );
}

export default ListElement;
