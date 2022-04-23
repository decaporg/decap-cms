import React from 'react';
import { render } from '@testing-library/react';
import { oneLineTrim } from 'common-tags';

import { ErrorBoundary } from '../ErrorBoundary';

function WithError() {
  throw new Error('Some unknown error');
}

jest.spyOn(console, 'error').mockImplementation(() => ({}));

Object.defineProperty(
  window.navigator,
  'userAgent',
  (value => ({
    get() {
      return value;
    },
    set(v) {
      value = v;
    },
  }))(window.navigator['userAgent']),
);

describe('Editor', () => {
  const config = { backend: { name: 'github' } };

  const props = { t: jest.fn(key => key), config };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot with issue URL', () => {
    global.navigator.userAgent = 'Test User Agent';
    const { getByTestId } = render(
      <ErrorBoundary {...props}>
        <WithError />
      </ErrorBoundary>,
    );

    expect(console.error).toHaveBeenCalledWith(new Error('Some unknown error'));
    expect(getByTestId('issue-url').getAttribute('href')).toEqual(
      oneLineTrim`https://github.com/netlify/netlify-cms/issues/new?
        title=Error%3A+Some+unknown+error&
        body=%0A**Describe+the+bug**%0A%0A**To+Reproduce**%0A%0A**Expected+behavior**%0A%0A**
        Screenshots**%0A%0A**Applicable+Versions%3A**%0A+-+
        Netlify+CMS+version%3A+%60%60%0A+-+
        Git+provider%3A+%60github%60%0A+-+
        Browser+version%3A+%60Test+User+Agent%60%0A%0A**
        CMS+configuration**%0A%60%60%60%0Abackend%3A%0A++name%3A+github%0A%0A%60%60%60%0A%0A**
        Additional+context**%0A&labels=type%3A+bug
        `,
    );
  });
});
