import { parseCliArgs } from '../args.js';

describe('parseCliArgs', () => {
  it('separates the command from its flags', () => {
    expect(parseCliArgs(['login', '--admin', '--api-url', 'http://localhost:4321'])).toEqual({
      positionals: ['login'],
      flags: { admin: true, 'api-url': 'http://localhost:4321' },
    });
  });

  it('accepts --flag=value', () => {
    expect(parseCliArgs(['whoami', '--api-url=http://x', '--json']).flags).toEqual({
      'api-url': 'http://x',
      json: true,
    });
  });

  it('maps -h and -v', () => {
    expect(parseCliArgs(['-h']).flags).toEqual({ help: true });
    expect(parseCliArgs(['-v']).flags).toEqual({ version: true });
  });

  it('refuses a value flag without a value', () => {
    expect(() => parseCliArgs(['login', '--api-url'])).toThrow(/needs a value/);
    expect(() => parseCliArgs(['login', '--api-url', '--admin'])).toThrow(/needs a value/);
  });

  it('refuses unknown short flags', () => {
    expect(() => parseCliArgs(['-x'])).toThrow(/Unknown option/);
  });

  it('stops parsing at --', () => {
    expect(parseCliArgs(['mcp', '--', '--admin']).positionals).toEqual(['mcp', '--admin']);
  });
});
