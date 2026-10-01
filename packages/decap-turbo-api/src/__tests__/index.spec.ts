import { operations, validateInput } from '../index';

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
