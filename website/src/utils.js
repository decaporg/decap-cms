import theme from './theme';

export const mq = theme.breakpoints.map(bp => `@media (min-width: ${bp}px)`);

export function themeGet(key, initial) {
  return props => props.theme[key] || initial;
}
