import { formatNoteBody, parseNoteBody } from '../notesFormat';

describe('note body format', () => {
  it('round trips an author and id through the marker', () => {
    const body = formatNoteBody({
      content: 'hello',
      resolved: false,
      author: 'Martin Jagodic',
      authorId: '11ea20d1-9887-4af0-874d-2f2aaa1d2378',
    });

    expect(parseNoteBody(body)).toEqual({
      content: 'hello',
      resolved: false,
      author: 'Martin Jagodic',
      authorId: '11ea20d1-9887-4af0-874d-2f2aaa1d2378',
    });
  });

  it('carries the resolved flag alongside the author', () => {
    const body = formatNoteBody({
      content: 'hello',
      resolved: true,
      author: 'Martin Jagodic',
      authorId: 'id-1',
    });

    expect(parseNoteBody(body).resolved).toBe(true);
  });

  it('writes the original format when no author id is recorded', () => {
    // What a backend whose poster IS the editor writes — the format predating
    // recorded authors, so those deployments see no change at all.
    expect(formatNoteBody({ content: 'hello', resolved: false, author: 'martinjagodic' })).toBe(
      '<!-- DecapCMS Note - Status: OPEN -->\nhello',
    );
  });

  it('reads a comment with no marker as an unresolved note', () => {
    // Someone typed a comment straight into the thread on the host.
    expect(parseNoteBody('just a comment')).toEqual({
      content: 'just a comment',
      resolved: false,
      author: undefined,
      authorId: undefined,
    });
  });

  it('reads the older marker that carried only a status', () => {
    expect(parseNoteBody('<!-- DecapCMS Note - Status: RESOLVED -->\nlegacy note')).toEqual({
      content: 'legacy note',
      resolved: true,
      author: undefined,
      authorId: undefined,
    });
  });

  it('does not let an author name close the HTML comment early', () => {
    const body = formatNoteBody({
      content: 'hello',
      resolved: false,
      author: 'evil --> <img src=x>',
      authorId: 'id-1',
    });

    expect(body.split('\n')[0].endsWith('-->')).toBe(true);
    expect(parseNoteBody(body)).toMatchObject({ content: 'hello', authorId: 'id-1' });
  });

  /**
   * The encoding is the contract between hosts: a repository whose notes were
   * written through one backend has to read identically through another, so
   * this pins the exact bytes rather than only the round trip.
   */
  it('pins the wire format', () => {
    expect(
      formatNoteBody({ content: 'hello', resolved: true, author: 'Ada', authorId: 'u1' }),
    ).toBe('<!-- DecapCMS Note - Status: RESOLVED - Author: Ada - AuthorId: u1 -->\nhello');
  });
});
