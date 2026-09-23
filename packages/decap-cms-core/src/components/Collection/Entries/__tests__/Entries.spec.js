import { render } from '@testing-library/react';
import { fromJS } from 'immutable';

import { Entries } from '../Entries';
import EntryListing from '../EntryListing';

jest.mock('../EntryListing', () => jest.fn(() => <mock-entry-listing />));

describe('Entries', () => {
  it('renders the listing when a collection only contains drafts', () => {
    render(
      <Entries
        collections={fromJS({ name: 'posts' })}
        entries={fromJS([])}
        cursor={{}}
        handleCursorActions={jest.fn()}
        getWorkflowStatus={jest.fn()}
        getUnpublishedEntries={jest.fn(() => [fromJS({ slug: 'draft' })])}
        t={key => key}
      />,
    );

    expect(EntryListing).toHaveBeenCalledTimes(1);
  });
});
