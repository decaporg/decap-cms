import React from 'react';

import Loader from '.';

export default {
  title: 'Components/Loader',
  component: Loader,
};

export function _Loader({ size, direction, children }) {
  return (
    <Loader size={size} direction={direction}>
      {children}
    </Loader>
  );
}

_Loader.argTypes = {
  size: {
    control: {
      type: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  direction: {
    control: {
      type: 'select',
      options: ['vertical', 'horizontal'],
    },
  },
  children: {
    control: {
      type: 'text',
    },
  },
};

_Loader.args = {
  size: 'md',
  direction: 'vertical',
  children: 'Loading...',
};
