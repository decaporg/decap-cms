import '../../utils/dismiss-local-backup';
import { login, createPostAndPublish, assertPublishedEntry } from '../../utils/steps';

export default function({ entries, getUser }) {
  it('successfully loads', () => {
    login(getUser());
  });

  it('can create an entry', () => {
    login(getUser());
    createPostAndPublish(entries[0]);
    assertPublishedEntry(entries[0]);
  });
}
