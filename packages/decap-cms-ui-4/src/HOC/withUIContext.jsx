import React from 'react';
import { UIContext } from '../UIContext';

export const withUIContext = Component => props => (
  <UIContext.Consumer>{context => <Component {...context} {...props} />}</UIContext.Consumer>
);
