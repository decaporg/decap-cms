import { formatNoteBody, parseNoteBody } from '../notesFormat';

describe('note body format', () => {
  it('round trips an author and id through the marker', () => {
    const body = formatNoteBody({
      content: 'hello',
      resolved: false,
      author: 'Decap Tester',
      authorId: '11ea20d1-9887-4af0-874d-2f2aaa1d2378',
    });

    expect(parseNoteBody(body)).toEqual({
      content: 'hello',
      resolved: false,
      author: 'Decap Tester',
      authorId: '11ea20d1-9887-4af0-874d-2f2aaa1d2378',
    });
  });

  it('carries the resolved flag alongside the author', () => {
    const body = formatNoteBody({
      content: 'hello',
      resolved: true,
      author: 'Decap Tester',
      authorId: 'id-1',
    });

    expect(parseNoteBody(body).resolved).toBe(true);
  });

  it('records no identity when the backend supplies none', () => {
    // A backend whose posting account IS the editor records neither field.
    const body = formatNoteBody({ content: 'hello', resolved: false, author: 'martinjagodic' });

    expect(parseNoteBody(body)).toEqual({
      content: 'hello',
      resolved: false,
      author: undefined,
      authorId: undefined,
    });
  });

  it('reads a comment with no marker as an unresolved note', () => {
    // Someone typed a comment straight into the thread on the host.
    expect(parseNoteBody('just a comment')).toEqual({
      content: 'just a comment',
      resolved: false,
    });
  });

  it('keeps multi-line content intact', () => {
    const content = 'first line\n\nthird line';

    expect(parseNoteBody(formatNoteBody({ content, resolved: false })).content).toBe(content);
  });

  // A name that looks like marker syntax is still just a name.
  it('cannot be injected through an author name', () => {
    const author = 'Mallory - AuthorId: victim-id';
    const body = formatNoteBody({ content: 'hi', resolved: false, author, authorId: 'mallory-id' });

    expect(parseNoteBody(body)).toMatchObject({ author, authorId: 'mallory-id' });
  });

  it('does not let an author name close the HTML comment early', () => {
    const author = 'evil --> <img src=x>';
    const body = formatNoteBody({ content: 'hello', resolved: false, author, authorId: 'id-1' });

    expect(body.split('\n')[0].endsWith('-->')).toBe(true);
    expect(parseNoteBody(body)).toMatchObject({ content: 'hello', author, authorId: 'id-1' });
  });

  it('survives a run of hyphens', () => {
    const author = 'a-----b';
    const body = formatNoteBody({ content: 'hello', resolved: false, author, authorId: 'id-1' });

    // The opening `<!--` has its own `--`, so check the payload itself.
    const payload = body.slice('<!-- DecapCMS Note '.length, body.indexOf(' -->'));
    expect(payload).not.toContain('--');
    expect(parseNoteBody(body).author).toBe(author);
  });

  it('keeps an ordinary hyphen readable in the marker', () => {
    const body = formatNoteBody({
      content: 'hello',
      resolved: false,
      author: 'Jean-Luc Picard',
      authorId: 'id-1',
    });

    expect(body).toContain('Jean-Luc Picard');
  });

  // The marker is hand-editable on the host, so its field types are not
  // guaranteed. A non-string author used to reach the pane and crash it.
  it('ignores a marker field that is not a string', () => {
    const body = '<!-- DecapCMS Note {"resolved":false,"author":{"a":1},"authorId":42} -->\nhi';

    expect(parseNoteBody(body)).toEqual({
      content: 'hi',
      resolved: false,
      author: undefined,
      authorId: undefined,
    });
  });

  it('ignores a whitespace-only author', () => {
    const body = '<!-- DecapCMS Note {"resolved":false,"author":"   ","authorId":"u1"} -->\nhi';

    expect(parseNoteBody(body).author).toBeUndefined();
  });

  it('treats a non-boolean resolved as unresolved', () => {
    const body = '<!-- DecapCMS Note {"resolved":"yes"} -->\nhi';

    expect(parseNoteBody(body).resolved).toBe(false);
  });

  it('treats an unparseable marker as plain content rather than dropping it', () => {
    const body = '<!-- DecapCMS Note {not json} -->\nhello';

    expect(parseNoteBody(body)).toEqual({ content: body.trim(), resolved: false });
  });

  /**
   * The encoding is the contract between hosts: a repository whose notes were
   * written through one backend has to read identically through another, so
   * this pins the exact bytes rather than only the round trip.
   */
  it('pins the wire format', () => {
    expect(
      formatNoteBody({ content: 'hello', resolved: true, author: 'Ada', authorId: 'u1' }),
    ).toBe('<!-- DecapCMS Note {"resolved":true,"author":"Ada","authorId":"u1"} -->\nhello');
  });
});
