/**
 * The Turbo commands generated from the API contract: every operation with
 * `cli` metadata is a `decap <words>` command, its input fields are flags, and
 * its summary is the help text. Adding an operation to decap-turbo-api adds
 * the command, with nothing to write here.
 */
import { flagName, operations, validateInput } from 'decap-turbo-api';

import type { JsonSchemaProperty, Operation } from 'decap-turbo-api';

/** Flags every command accepts that are not input fields. */
const GLOBAL_FLAGS = new Set(['api-url', 'json', 'help', 'admin', 'version']);

export function commandOperations(): Operation[] {
  return (Object.values(operations) as Operation[]).filter(op => op.cli);
}

/** The operation whose command words start the positionals, longest match first. */
export function findCommand(positionals: readonly string[]): Operation | null {
  const candidates = commandOperations()
    .filter(op => op.cli!.command.every((word, i) => positionals[i] === word))
    .sort((a, b) => b.cli!.command.length - a.cli!.command.length);
  return candidates[0] ?? null;
}

function parseValue(field: string, prop: JsonSchemaProperty, raw: string | boolean): unknown {
  const flag = `--${flagName(field)}`;
  if (prop.type === 'boolean') return raw === true || raw === 'true';
  if (raw === true) throw new Error(`${flag} needs a value.`);
  if (prop.type === 'integer' || prop.type === 'number') {
    const value = Number(raw);
    if (Number.isNaN(value)) throw new Error(`${flag} must be a number.`);
    return value;
  }
  return raw;
}

/** Turns flags into the operation's input, checked against its schema, with errors phrased as flags. */
export function inputFromFlags(
  op: Operation,
  flags: Record<string, string | boolean>,
): Record<string, unknown> {
  const byFlag = new Map(Object.keys(op.input.properties).map(field => [flagName(field), field]));
  const input: Record<string, unknown> = {};

  for (const [flag, raw] of Object.entries(flags)) {
    if (GLOBAL_FLAGS.has(flag)) continue;
    const field = byFlag.get(flag);
    if (!field) {
      const known = [...byFlag.keys()].map(name => `--${name}`).join(', ') || 'none';
      throw new Error(
        `Unknown flag --${flag} for "decap ${op.cli!.command.join(' ')}". Flags: ${known}.`,
      );
    }
    input[field] = parseValue(field, op.input.properties[field], raw);
  }

  const result = validateInput(op.input, input);
  if (!result.ok) {
    let message = result.errors.join(' ');
    for (const field of Object.keys(op.input.properties)) {
      message = message.split(`"${field}"`).join(`--${flagName(field)}`);
    }
    throw new Error(message);
  }
  return result.value;
}

export function commandHelp(op: Operation): string {
  const required = new Set(op.input.required ?? []);
  const lines = [`decap ${op.cli!.command.join(' ')}`, '', op.summary, ''];
  const fields = Object.entries(op.input.properties);
  if (fields.length > 0) {
    lines.push('Flags:');
    const width = Math.max(...fields.map(([field]) => flagName(field).length)) + 2;
    for (const [field, prop] of fields) {
      const choices = prop.type === 'string' && prop.enum ? ` (${prop.enum.join(', ')})` : '';
      lines.push(
        `  --${flagName(field).padEnd(width)}${required.has(field) ? 'required. ' : ''}${
          prop.description ?? ''
        }${choices}`,
      );
    }
    lines.push('');
  }
  lines.push(
    `Needs ${op.scope === 'admin' ? 'admin scope (decap login --admin)' : 'a signed-in token'}.`,
  );
  lines.push('Add --json for machine-readable output.');
  return lines.join('\n');
}

/** One line per command, for the main help. */
export function commandList(): string {
  const ops = commandOperations();
  const width = Math.max(...ops.map(op => op.cli!.command.join(' ').length)) + 2;
  return ops
    .map(op => {
      const sentence = op.summary.split(/(?<=\.)\s/)[0];
      return `  decap ${op.cli!.command.join(' ').padEnd(width)}${sentence}`;
    })
    .join('\n');
}

// --- Output ----------------------------------------------------------------

function cell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function table(rows: Record<string, unknown>[], columns?: readonly string[]): string {
  if (rows.length === 0) return '(none)';
  const cols = columns ?? Object.keys(rows[0]).filter(key => typeof rows[0][key] !== 'object');
  const widths = cols.map(col => Math.max(col.length, ...rows.map(row => cell(row[col]).length)));
  function line(values: string[]): string {
    return values
      .map((value, i) => value.padEnd(widths[i]))
      .join('  ')
      .trimEnd();
  }
  return [
    line(cols.map(col => col.toUpperCase())),
    ...rows.map(row => line(cols.map(col => cell(row[col])))),
  ].join('\n');
}

/** Human output for a command's result: tables for lists, key/value lines for one object. */
export function formatResult(op: Operation, result: unknown): string {
  if (result === undefined || result === null) return 'Done.';
  if (Array.isArray(result)) return table(result as Record<string, unknown>[], op.cli?.columns);

  const object = result as Record<string, unknown>;
  if (
    typeof object.message === 'string' &&
    Object.keys(object).every(key => ['ok', 'message'].includes(key))
  ) {
    return object.message;
  }

  const sections: string[] = [];
  const scalars: string[] = [];
  const width = Math.max(...Object.keys(object).map(key => key.length)) + 2;
  for (const [key, value] of Object.entries(object)) {
    if (key === 'warning') continue;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      // The operation's columns describe its main list; a second list in the
      // same response (invitations beside members) has its own fields.
      const rows = value as Record<string, unknown>[];
      const columns = op.cli?.columns?.every(col => col in rows[0]) ? op.cli.columns : undefined;
      sections.push(`${key}:\n${table(rows, columns)}`);
    } else if (Array.isArray(value) && value.length === 0 && key !== 'admin_interface_urls') {
      sections.push(`${key}: (none)`);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      scalars.push(
        `${key.padEnd(width)}${Object.entries(nested)
          .map(([k, v]) => `${k} ${cell(v)}`)
          .join(', ')}`,
      );
    } else {
      scalars.push(`${key.padEnd(width)}${cell(value)}`);
    }
  }
  return [...(scalars.length ? [scalars.join('\n')] : []), ...sections].join('\n\n');
}
