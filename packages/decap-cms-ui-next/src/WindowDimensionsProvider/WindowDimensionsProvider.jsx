import React, { createContext, useContext, useState, useEffect } from 'react';

export const WindowDimensionsCtx = createContext(null);

function windowDims() {
  return {
    height: window.innerHeight,
    width: window.innerWidth,
  };
}

function WindowDimensionsProvider({ children }) {
  const [dimensions, setDimensions] = useState(windowDims());

  useEffect(() => {
    function handleResize() {
      setDimensions(windowDims());
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <WindowDimensionsCtx.Provider value={dimensions}>{children}</WindowDimensionsCtx.Provider>;
}

export default WindowDimensionsProvider;

export function useWindowDimensions() {
  return useContext(WindowDimensionsCtx);
}
