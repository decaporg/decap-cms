/**
 * The Decap Turbo API contract: one definition per operation, shared by the
 * Turbo server's `/api/v1` routes (input validation), the `decap` CLI
 * (commands and flags) and the CLI's MCP server (tool names, descriptions,
 * input schemas).
 *
 * Published on its own so the Turbo server, a separate private repository,
 * can pin the exact contract a CLI release was built against. An API change
 * lands here first; the server then bumps its pin.
 *
 * Deliberately dependency-free. Input schemas are plain JSON Schema objects —
 * the format MCP wants anyway — checked by the small validator at the bottom
 * of this file, which covers the flat request bodies the API takes.
 */

export type Scope = 'editor' | 'admin';

export type JsonSchemaProperty =
  | {
      type: 'string';
      description?: string;
      enum?: readonly string[];
      pattern?: string;
      minLength?: number;
      maxLength?: number;
    }
  | { type: 'integer' | 'number'; description?: string; minimum?: number; maximum?: number }
  | { type: 'boolean'; description?: string };

export interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: readonly string[];
  additionalProperties: false;
}

export interface Operation {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Path under /api/v1, e.g. `/me`. */
  path: string;
  summary: string;
  /** How the caller authenticates. `none` is only for the login code exchange. */
  auth: 'token' | 'none';
  /** Minimum token scope. Absent for `auth: 'none'`. */
  scope?: Scope;
  input: JsonSchemaObject;
  /** Exposed as an MCP tool when present. */
  mcp?: { name: string; title: string; readOnly: boolean; destructive?: boolean };
}

const NO_INPUT: JsonSchemaObject = { type: 'object', properties: {}, additionalProperties: false };

export const operations = {
  me: {
    id: 'me',
    method: 'GET',
    path: '/me',
    summary:
      'Who the caller is: the Turbo user behind the token, the token itself, and the organizations they belong to with their role in each.',
    auth: 'token',
    scope: 'editor',
    input: NO_INPUT,
    mcp: { name: 'whoami', title: 'Who am I in Decap Turbo', readOnly: true },
  },
  cliToken: {
    id: 'cliToken',
    method: 'POST',
    path: '/cli/token',
    summary:
      'Trade the one-time code from `decap login` and its PKCE verifier for a personal access token.',
    auth: 'none',
    input: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          pattern: '^[A-Za-z0-9_-]{43}$',
          description: 'Code delivered to the loopback callback',
        },
        code_verifier: {
          type: 'string',
          pattern: '^[A-Za-z0-9._~-]{43,128}$',
          description: 'PKCE verifier whose S256 challenge was sent to /cli/authorize',
        },
      },
      required: ['code', 'code_verifier'],
      additionalProperties: false,
    },
  },
  revokeCurrentToken: {
    id: 'revokeCurrentToken',
    method: 'POST',
    path: '/cli/logout',
    summary: 'Revoke the token making this request. Used by `decap logout`.',
    auth: 'token',
    scope: 'editor',
    input: NO_INPUT,
  },
} as const satisfies Record<string, Operation>;

export type OperationId = keyof typeof operations;

// --- Response shapes -------------------------------------------------------

export interface ApiError {
  error: { code: string; message: string };
}

export interface MeResponse {
  user: { id: string; email: string | null; name: string | null };
  /** Null when the caller is a dashboard session rather than a token. */
  token: { id: string; name: string; scope: Scope; expires_at: string | null } | null;
  organizations: Array<{ id: string; name: string; plan: string; role: 'owner' | 'member' }>;
}

export interface CliTokenResponse {
  token: string;
  token_id: string;
  scope: Scope;
  expires_at: string | null;
}

// --- Validation ------------------------------------------------------------

export type ValidationResult<T = Record<string, unknown>> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

/** Validates a request body or query against an operation's input schema. */
export function validateInput<T = Record<string, unknown>>(
  schema: JsonSchemaObject,
  input: unknown,
): ValidationResult<T> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['Body must be a JSON object.'] };
  }

  const errors: string[] = [];
  const value = input as Record<string, unknown>;

  for (const key of Object.keys(value)) {
    if (!(key in schema.properties)) errors.push(`Unknown field "${key}".`);
  }

  for (const key of schema.required ?? []) {
    if (value[key] === undefined || value[key] === null) errors.push(`"${key}" is required.`);
  }

  for (const [key, prop] of Object.entries(schema.properties)) {
    const v = value[key];
    if (v === undefined || v === null) continue;

    if (prop.type === 'string') {
      if (typeof v !== 'string') {
        errors.push(`"${key}" must be a string.`);
        continue;
      }
      if (prop.minLength !== undefined && v.length < prop.minLength)
        errors.push(`"${key}" is too short.`);
      if (prop.maxLength !== undefined && v.length > prop.maxLength)
        errors.push(`"${key}" is too long.`);
      if (prop.pattern !== undefined && !new RegExp(prop.pattern).test(v))
        errors.push(`"${key}" is malformed.`);
      if (prop.enum !== undefined && !prop.enum.includes(v)) {
        errors.push(`"${key}" must be one of: ${prop.enum.join(', ')}.`);
      }
    } else if (prop.type === 'integer' || prop.type === 'number') {
      if (
        typeof v !== 'number' ||
        Number.isNaN(v) ||
        (prop.type === 'integer' && !Number.isInteger(v))
      ) {
        errors.push(`"${key}" must be ${prop.type === 'integer' ? 'an integer' : 'a number'}.`);
        continue;
      }
      if (prop.minimum !== undefined && v < prop.minimum)
        errors.push(`"${key}" must be at least ${prop.minimum}.`);
      if (prop.maximum !== undefined && v > prop.maximum)
        errors.push(`"${key}" must be at most ${prop.maximum}.`);
    } else if (prop.type === 'boolean') {
      if (typeof v !== 'boolean') errors.push(`"${key}" must be true or false.`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, value: value as T };
}
