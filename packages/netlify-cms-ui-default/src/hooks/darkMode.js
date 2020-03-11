import { useContext } from 'react';
import { UIContext } from '../AppWrap'

export const useDarkMode = () => {
  const {darkMode, setDarkMode} = useContext(UIContext);
  return [darkMode, setDarkMode];
};
