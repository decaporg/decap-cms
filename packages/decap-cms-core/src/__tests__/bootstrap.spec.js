import { createRoot } from 'react-dom/client';

import bootstrap from '../bootstrap';

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));
jest.mock('../redux', () => ({
  store: { dispatch: jest.fn(), getState: jest.fn(), subscribe: jest.fn() },
}));
jest.mock('../actions/config', () => ({ loadConfig: jest.fn(() => ({ type: 'LOAD_CONFIG' })) }));
jest.mock('../actions/auth', () => ({ authenticateUser: jest.fn() }));

describe('bootstrap', () => {
  beforeEach(() => {
    createRoot.mockClear();
    document.body.innerHTML = '';
  });

  it('reuses the React root when init runs twice', () => {
    bootstrap();
    bootstrap();

    expect(createRoot).toHaveBeenCalledTimes(1);
    expect(createRoot.mock.results[0].value.render).toHaveBeenCalledTimes(2);
  });

  it('creates a new root for a new container', () => {
    bootstrap();

    expect(createRoot).toHaveBeenCalledTimes(1);
    expect(createRoot).toHaveBeenCalledWith(document.getElementById('nc-root'));
  });
});
