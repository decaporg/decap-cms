import { UIContext } from '../AppWrap'

export const withAppBarStart = Component => props => (
  <UIContext.Consumer>
    {({appBarStart, setAppBarStart}) => <Component appBarStart={appBarStart} setAppBarStart={setAppBarStart} {...props} />}
  </UIContext.Consumer>
);
export const withAppBarEnd = Component => props => (
  <UIContext.Consumer>
    {({appBarEnd, setAppBarEnd}) => <Component appBarEnd={appBarEnd} setAppBarEnd={setAppBarEnd} {...props} />}
  </UIContext.Consumer>
);
