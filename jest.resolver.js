module.exports = (request, options) => {
  if (/^(?:platejs|@platejs\/[^/]+)\/react$/.test(request)) {
    return require.resolve(request, { paths: [options.basedir] });
  }

  return options.defaultResolver(request, options);
};
