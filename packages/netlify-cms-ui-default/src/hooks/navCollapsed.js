import { useContext } from 'react'
import { UIContext } from '../AppWrap'

export const useNavCollapsed = () => {
  const {navCollapsed, setNavCollapsed} = useContext(UIContext);
  return [navCollapsed, setNavCollapsed];
};
