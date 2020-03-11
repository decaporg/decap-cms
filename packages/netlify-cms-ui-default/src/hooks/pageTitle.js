import { useContext } from 'react'
import { UIContext } from '../AppWrap'

export const usePageTitle = () => {
  const { pageTitle, setPageTitle } = useContext(UIContext);
  return [pageTitle, setPageTitle];
};
