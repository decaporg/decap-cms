import { useContext } from 'react'
import { UIContext } from '../AppWrap'

export const useAppBarStart = () => {
  const {appBarStart, setAppBarStart} = useContext(UIContext);
  return [appBarStart, setAppBarStart];
};
export const useAppBarEnd = () => {
  const {appBarEnd, setAppBarEnd} = useContext(UIContext);
  return [appBarEnd, setAppBarEnd];
};
