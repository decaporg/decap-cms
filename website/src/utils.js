import theme from './theme';

export const mq = theme.breakpoints.map(bp => `@media (min-width: ${bp}px)`);

export const themeGet = (key, initial) => props => props.theme[key] || initial;
