import { getSourceInfo } from '../EditorNotesPane';

describe('getSourceInfo', () => {
  it('names the host it recognises', () => {
    expect(getSourceInfo('https://github.com/owner/repo/issues/1').text).toBe('View in GitHub');
    expect(getSourceInfo('https://gitlab.com/owner/repo/-/issues/1').text).toBe('View in GitLab');
  });

  it('matches a subdomain of a host it recognises', () => {
    expect(getSourceInfo('https://www.github.com/owner/repo/issues/1').text).toBe('View in GitHub');
  });

  // A substring test would call all of these GitHub or GitLab.
  it('does not name a host that merely contains the name', () => {
    expect(getSourceInfo('https://notgithub.com/owner/repo').text).toBe('View source');
    expect(getSourceInfo('https://github.com.example.net/owner/repo').text).toBe('View source');
    expect(getSourceInfo('https://example.net/?q=github.com').text).toBe('View source');
  });

  it('still offers a link for a self-hosted instance', () => {
    expect(getSourceInfo('https://git.example.com/owner/repo/-/issues/1')).toEqual({
      text: 'View source',
      iconType: 'link',
    });
  });

  it('does not throw on something that is not a url', () => {
    expect(getSourceInfo('not a url').text).toBe('View source');
  });
});
