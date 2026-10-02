import { operations } from 'decap-turbo-api';

import {
  commandHelp,
  commandList,
  findCommand,
  formatResult,
  inputFromFlags,
} from '../commands.js';

const ORG = '14dc6a52-dd6f-44fb-9b3b-d9658a6289ae';

describe('findCommand', () => {
  it('matches the command words', () => {
    expect(findCommand(['sites', 'list'])?.id).toBe('listSites');
    expect(findCommand(['site-members', 'set-role'])?.id).toBe('setSiteMemberRole');
  });

  it('returns null for words that are not a command', () => {
    expect(findCommand(['sites'])).toBeNull();
    expect(findCommand(['nope', 'list'])).toBeNull();
  });
});

describe('inputFromFlags', () => {
  it('maps flags to input fields, dropping _id', () => {
    expect(
      inputFromFlags(operations.createSite, {
        org: ORG,
        name: 'Blog',
        'config-path': 'cms/config.yml',
      }),
    ).toEqual({
      org_id: ORG,
      name: 'Blog',
      config_path: 'cms/config.yml',
    });
  });

  it('parses numbers', () => {
    expect(inputFromFlags(operations.listDeploys, { site: ORG, limit: '5' })).toEqual({
      site_id: ORG,
      limit: 5,
    });
    expect(() => inputFromFlags(operations.listDeploys, { site: ORG, limit: 'many' })).toThrow(
      /--limit must be a number/,
    );
  });

  it('ignores global flags', () => {
    expect(
      inputFromFlags(operations.listSites, { org: ORG, json: true, 'api-url': 'http://x' }),
    ).toEqual({ org_id: ORG });
  });

  it('names unknown flags and lists the real ones', () => {
    expect(() => inputFromFlags(operations.listSites, { org: ORG, colour: 'red' })).toThrow(
      'Unknown flag --colour for "decap sites list". Flags: --org.',
    );
  });

  it('phrases schema errors as flags', () => {
    expect(() => inputFromFlags(operations.createSite, { org: ORG })).toThrow(
      '--name is required.',
    );
    expect(() =>
      inputFromFlags(operations.inviteMember, { org: ORG, email: 'a@b.c', role: 'admin' }),
    ).toThrow('--role must be one of: owner, member.');
  });
});

describe('help', () => {
  it('lists every command with the first sentence of its summary', () => {
    const list = commandList();
    expect(list).toContain('decap sites create');
    expect(list).toContain('decap cache clear');
    expect(list).not.toContain('Organization owners only');
  });

  it('documents flags, required ones and the scope', () => {
    const help = commandHelp(operations.inviteMember);
    expect(help).toContain('--email');
    expect(help).toContain('required.');
    expect(help).toContain('(owner, member)');
    expect(help).toContain('admin scope');
  });
});

describe('formatResult', () => {
  it('prints lists as a table with the operation’s columns', () => {
    const out = formatResult(operations.listOrgs, [
      { id: ORG, name: 'decap', role: 'owner', plan: 'free' },
    ]);
    expect(out.split('\n')[0]).toMatch(/^ID\s+NAME\s+ROLE\s+PLAN$/);
    expect(out).toContain('decap');
  });

  it('prints a bare message for simple mutations', () => {
    expect(formatResult(operations.clearCache, { ok: true, message: 'Cache cleared.' })).toBe(
      'Cache cleared.',
    );
  });

  it('prints nested lists as sections', () => {
    const out = formatResult(operations.listMembers, {
      members: [{ user_id: 'u1', email: 'a@b.c', role: 'owner' }],
      invitations: [],
    });
    expect(out).toContain('members:');
    expect(out).toContain('a@b.c');
    expect(out).toContain('invitations: (none)');
  });
});
