/**
 * A small argument parser for `decap`. Not `util.parseArgs`: this repo's
 * `@types/node` predates it, and the commands generated from the API contract
 * take flags that can't be listed up front.
 *
 * `--flag value` and `--flag=value` take a value; the flags in BOOLEAN_FLAGS
 * never do. Positionals are the command words (`sites list`).
 */
export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

/** Flags that are switches. Every other `--flag` needs a value. */
const BOOLEAN_FLAGS = new Set(['admin', 'json', 'help', 'version']);

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
      if (BOOLEAN_FLAGS.has(name)) {
        flags[name] = inline === undefined ? true : inline !== 'false';
        continue;
      }
      const value = inline ?? argv[i + 1];
      if (value === undefined || (inline === undefined && value.startsWith('--'))) {
        throw new Error(`--${name} needs a value.`);
      }
      flags[name] = value;
      if (inline === undefined) i++;
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
