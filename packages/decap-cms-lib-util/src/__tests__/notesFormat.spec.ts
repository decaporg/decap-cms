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

  /**
   * The delimited format this replaced could be injected through a display
   * name: a name containing ` - AuthorId: ` split the marker in the wrong
   * place and corrupted the id the ownership check compares on. Structure
   * comes from the parser now, so the name is just a string.
   */
  it('cannot be injected through an author name', () => {
    const author = 'Mallory - AuthorId: victim-id';
    const body = formatNoteBody({ content: 'hi', resolved: false, author, authorId: 'mallory-id' });

    expect(parseNoteBody(body)).toMatchObject({ author, authorId: 'mallory-id' });
  });

  it('does not let an author name close the HTML comment early', () => {
    const author = 'evil --> <img src=x>';
    const body = formatNoteBody({ content: 'hello', resolved: false, author, authorId: 'id-1' });

    expect(body.split('\n')[0].endsWith('-->')).toBe(true);
    // Lossless, unlike the delimited format, which deleted the `-->` outright.
    expect(parseNoteBody(body)).toMatchObject({ content: 'hello', author, authorId: 'id-1' });
  });

  it('survives a run of hyphens', () => {
    // Escaping `--` in a single pass leaves a `--` at the seam; escaping each
    // hyphen that precedes another does not.
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
