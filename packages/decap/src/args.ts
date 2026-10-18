/**
 * A small argument parser for `decap`. Not `util.parseArgs`: this repo's
 * `@types/node` predates it, and the commands generated from the API contract
 * take flags that can't be listed up front.
 *
 * `--flag value` and `--flag=value` take a value; switches never do, and
 * `--switch=false` turns one off. Positionals are the command words
 * (`sites list`).
 */
import { switchFlags } from './commands.js';

export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

const SHORT_FLAGS: Record<string, string> = { h: 'help', v: 'version' };

/**
 * `switches` are the flags that never take a value; every other `--flag`
 * needs one. By default the global switches and the boolean fields of the
 * contract's commands.
 */
export function parseCliArgs(
  argv: readonly string[],
  switches: ReadonlySet<string> = switchFlags(),
): ParsedArgs {
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
      if (switches.has(name)) {
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
