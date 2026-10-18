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

  it('treats any other --flag as taking a value, for the generated commands', () => {
    expect(parseCliArgs(['sites', 'list', '--org', 'o1', '--json'])).toEqual({
      positionals: ['sites', 'list'],
      flags: { org: 'o1', json: true },
    });
  });

  it('lets a value start with a single dash', () => {
    expect(parseCliArgs(['sites', 'update', '--name', '-draft-']).flags).toEqual({
      name: '-draft-',
    });
  });

  it('treats boolean contract fields as switches', () => {
    expect(parseCliArgs(['editor', 'open', '--site', 's1', '--new-entry'])).toEqual({
      positionals: ['editor', 'open'],
      flags: { site: 's1', 'new-entry': true },
    });
    // A switch never swallows the next word; the command then refuses it.
    expect(parseCliArgs(['editor', 'open', '--new-entry', 'posts'])).toEqual({
      positionals: ['editor', 'open', 'posts'],
      flags: { 'new-entry': true },
    });
    expect(parseCliArgs(['editor', 'open', '--new-entry=false']).flags).toEqual({
      'new-entry': false,
    });
  });

  it('takes the switches it is given', () => {
    expect(parseCliArgs(['x', '--dry-run', 'y'], new Set(['dry-run']))).toEqual({
      positionals: ['x', 'y'],
      flags: { 'dry-run': true },
    });
  });

  it('stops parsing at --', () => {
    expect(parseCliArgs(['mcp', '--', '--admin']).positionals).toEqual(['mcp', '--admin']);
  });
});
