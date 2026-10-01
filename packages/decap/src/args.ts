/**
 * A small argument parser for the handful of flags `decap` takes. Not
 * `util.parseArgs`: this repo's `@types/node` predates it, and the CLI needs
 * nothing a dozen lines can't do.
 */
export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

/** Flags that take a value. Every other `--flag` is a boolean. */
const VALUE_FLAGS = new Set(['api-url']);

const SHORT_FLAGS: Record<string, string> = { h: 'help', v: 'version' };

export function parseCliArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }

    if (arg.startsWith('--')) {
      const [name, inline] = arg.slice(2).split(/=(.*)/s, 2);
      if (VALUE_FLAGS.has(name)) {
        const value = inline ?? argv[i + 1];
        if (value === undefined || (inline === undefined && value.startsWith('-'))) {
          throw new Error(`--${name} needs a value.`);
        }
        flags[name] = value;
        if (inline === undefined) i++;
      } else {
        flags[name] = true;
      }
      continue;
    }

    if (/^-[a-z]$/i.test(arg)) {
      const name = SHORT_FLAGS[arg.slice(1)];
      if (!name) throw new Error(`Unknown option ${arg}.`);
      flags[name] = true;
      continue;
    }

    positionals.push(arg);
  }

  return { positionals, flags };
}
