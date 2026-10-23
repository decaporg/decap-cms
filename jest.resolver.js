const fs = require('fs');
const path = require('path');

const decapPackage = path.join(__dirname, 'packages', 'decap') + path.sep;

// Conditions to pick from an `exports` map, in order of preference: the
// CommonJS build where there is one, so only ESM-only packages need to be in
// transformIgnorePatterns.
const CONDITIONS = ['require', 'import', 'default'];

function pickTarget(target) {
  if (typeof target === 'string') return target;
  if (Array.isArray(target)) {
    for (const item of target) {
      const picked = pickTarget(item);
      if (picked) return picked;
    }
    return null;
  }
  if (target && typeof target === 'object') {
    for (const condition of CONDITIONS) {
      if (condition in target) {
        const picked = pickTarget(target[condition]);
        if (picked) return picked;
      }
    }
  }
  return null;
}

/**
 * Jest 27 ignores package.json `exports`, so it can't find subpath imports
 * (`zustand-x/vanilla`) or packages that only ship ES modules (Plate). Resolve
 * a bare specifier through its package's `exports` map instead.
 */
function resolveFromExports(request, basedir) {
  const match = request.match(/^((?:@[^/]+\/)?[^/.][^/]*)(\/.*)?$/);
  if (!match) return null;
  const [, name, rest = ''] = match;

  // pnpm links a package's dependencies next to its real location, not the
  // symlink it was reached through.
  let packageDir = null;
  for (let dir = fs.realpathSync(basedir); ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      packageDir = candidate;
      break;
    }
    if (path.dirname(dir) === dir) return null;
  }

  const { exports } = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
  if (!exports) return null;

  const subpath = `.${rest}`;
  const isSubpathMap = typeof exports === 'object' && Object.keys(exports)[0]?.startsWith('.');
  const entry = isSubpathMap ? exports[subpath] : subpath === '.' ? exports : undefined;
  const target = pickTarget(entry);

  return target ? path.join(packageDir, target) : null;
}

module.exports = (request, options) => {
  // packages/decap is ESM TypeScript and imports siblings as `./api.js`, as
  // node16 resolution requires. Strip the extension there so jest finds the
  // .ts; everywhere else a `.js` import means the .js file.
  if (/^\.{1,2}\/.*\.js$/.test(request) && (options.basedir + path.sep).startsWith(decapPackage)) {
    return options.defaultResolver(request.slice(0, -3), options);
  }

  try {
    return options.defaultResolver(request, options);
  } catch (error) {
    const resolved = resolveFromExports(request, options.basedir);
    if (resolved) return resolved;
    throw error;
  }
};
