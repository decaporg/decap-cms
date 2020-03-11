import { UIContext } from '../AppWrap'

export const withPageTitle = Component => props => (
  <UIContext.Consumer>
    {({pageTitle, setPageTitle}) => <Component pageTitle={pageTitle} setPageTitle={setPageTitle} {...props} />}
  </UIContext.Consumer>
);
