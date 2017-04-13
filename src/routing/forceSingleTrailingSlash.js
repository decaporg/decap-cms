export function forceSingleTrailingSlash(nextState, replace) {
  const path = nextState.location.pathname;
  if (path.slice(-1) !== '/' || path.slice(-2) === '//') {
    replace({
      ...nextState.location,
      pathname: path.replace(/\/*$/, '/'),
    });
  }
}

export function forceTrailingSlashOnChange(prevState, nextState, replace) {
  forceSingleTrailingSlash(nextState, replace);
}
