import { UIContext } from '../AppWrap'

export const withDarkMode = Component => props => (
  <UIContext.Consumer>
    {({darkMode, setDarkMode}) => <Component isDarkMode={isDarkMode} setDarkMode={setDarkMode} {...props} />}
  </UIContext.Consumer>
);
