/**
 * Stand-in for `js-yaml`, which `gray-matter` loads for its default YAML
 * engine. Decap passes its own `yaml` engine on every `matter()` and
 * `matter.stringify()` call (see decap-cms-core/src/formats/frontmatter.ts), so
 * the default is never used in the browser bundles.
 */
function unused() {
  throw new Error(
    'js-yaml is not bundled with Decap CMS; pass a yaml engine to gray-matter instead.',
  );
}

module.exports = { safeLoad: unused, safeDump: unused };
