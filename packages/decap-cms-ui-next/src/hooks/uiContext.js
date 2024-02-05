import { useContext } from 'react';

import { UIContext } from '../UIContext';

export function useUIContext() {
  return useContext(UIContext);
}
