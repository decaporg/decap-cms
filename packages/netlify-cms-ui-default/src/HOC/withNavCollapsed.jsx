import { UIContext } from '../AppWrap'

export const withNavCollapsed = Component => props => (
  <UIContext.Consumer>
    {({navCollapsed, setNavCollapsed}) => <Component isNavCollapsed={isNavCollapsed} setNavCollapsed={setNavCollapsed} {...props} />}
  </UIContext.Consumer>
);
