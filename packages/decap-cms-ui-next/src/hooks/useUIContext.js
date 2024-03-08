import { useContext } from 'react';

import { UIContext } from '../UIContext';

export default function useUIContext() {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }

  return context;
}
