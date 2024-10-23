import React from 'react';
import { PlateElement } from '@udecode/plate-common/react';
import styled from '@emotion/styled';

const headingVariants = {
  h1: {
    fontSize: '32px',
    marginTop: '16px',
  },
  h2: {
    fontSize: '24px',
    marginTop: '12px',
  },
  h3: {
    fontSize: '20px',
  },
  h4: {
    fontSize: '18px',
    marginTop: '8px',
  },
  h5: {
    fontSize: '16px',
    marginTop: '8px',
  },
  h6: {
    fontSize: '16px',
    marginTop: '8px',
  },
};

const StyledHeading = styled(PlateElement)`
  font-weight: 700;
  line-height: 1;
  margin-top: ${props => (props.isFirstBlock ? '0' : headingVariants[props.variant].marginTop)};
  font-size: ${props => headingVariants[props.variant].fontSize};
`;

function HeadingElement({ variant = 'h1', children, ...props }) {
  const { element, editor } = props;
  const isFirstBlock = element === editor.children[0];

  const Element = StyledHeading.withComponent(variant);

  return (
    <Element {...props} isFirstBlock={isFirstBlock} variant={variant}>
      {children}
    </Element>
  );
}

export default HeadingElement;
