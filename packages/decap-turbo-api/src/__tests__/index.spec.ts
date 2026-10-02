import { buildRequest, flagName, operations, pathParams, validateInput } from '../index';

import type { Operation } from '../index';

describe('validateInput', () => {
  it('accepts a valid login exchange', () => {
    const body = { code: 'a'.repeat(43), code_verifier: 'b'.repeat(43) };
    expect(validateInput(operations.cliToken.input, body)).toEqual({ ok: true, value: body });
  });

  it('reports missing, malformed and unknown fields together', () => {
    const result = validateInput(operations.cliToken.input, { code: 'short', extra: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          'Unknown field "extra".',
          '"code_verifier" is required.',
          '"code" is malformed.',
        ]),
      );
    }
  });

  it('rejects non-object bodies', () => {
    expect(validateInput(operations.me.input, [1]).ok).toBe(false);
    expect(validateInput(operations.me.input, null).ok).toBe(false);
  });

  it('gives every MCP tool a title and a read-only or destructive hint', () => {
    for (const op of Object.values(operations)) {
      if (!('mcp' in op)) continue;
      expect(op.mcp.title).toBeTruthy();
      expect(typeof op.mcp.readOnly).toBe('boolean');
    }
  });
});

describe('operations', () => {
  it('declares every path parameter as a required input field', () => {
    for (const op of Object.values(operations) as Operation[]) {
      for (const param of pathParams(op)) {
        expect([op.id, param, param in op.input.properties]).toEqual([op.id, param, true]);
        expect([op.id, param, (op.input.required ?? []).includes(param)]).toEqual([
          op.id,
          param,
          true,
        ]);
      }
    }
  });

  it('gives every MCP tool and CLI command a unique name', () => {
    const ops = Object.values(operations) as Operation[];
    const tools = ops.filter(op => op.mcp).map(op => op.mcp!.name);
    const commands = ops.filter(op => op.cli).map(op => op.cli!.command.join(' '));
    expect(new Set(tools).size).toBe(tools.length);
    expect(new Set(commands).size).toBe(commands.length);
  });

  it('marks every mutating MCP tool as not read-only, and only reads as read-only', () => {
    for (const op of Object.values(operations) as Operation[]) {
      if (!op.mcp) continue;
      expect([op.id, op.mcp.readOnly]).toEqual([op.id, op.method === 'GET']);
    }
  });

  it('requires admin scope for every mutation exposed to agents', () => {
    for (const op of Object.values(operations) as Operation[]) {
      if (op.mcp && op.method !== 'GET') expect([op.id, op.scope]).toEqual([op.id, 'admin']);
    }
  });
});

describe('buildRequest', () => {
  it('fills path parameters and sends the rest as the body', () => {
    expect(
      buildRequest(operations.updateSite, { site_id: 'abc', name: 'Blog', branch: undefined }),
    ).toEqual({ path: '/sites/abc', query: {}, body: { name: 'Blog' } });
  });

  it('sends the rest as the query string for GET and DELETE', () => {
    expect(buildRequest(operations.listDeploys, { site_id: 's1', limit: 5 })).toEqual({
      path: '/sites/s1/deploys',
      query: { limit: '5' },
      body: null,
    });
  });

  it('encodes path segments, so an email can name a member', () => {
    expect(
      buildRequest(operations.removeMember, { org_id: 'o1', member: 'a+b@example.com' }).path,
    ).toBe('/orgs/o1/members/a%2Bb%40example.com');
  });

  it('refuses a missing path parameter', () => {
    expect(() => buildRequest(operations.getSite, {})).toThrow(/site_id/);
  });
});

describe('flagName', () => {
  it('drops a trailing _id and kebab-cases the rest', () => {
    expect(flagName('org_id')).toBe('org');
    expect(flagName('site_role_id')).toBe('site-role');
    expect(flagName('config_path')).toBe('config-path');
    expect(flagName('email')).toBe('email');
  });
});
