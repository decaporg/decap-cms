import { fromJS } from 'immutable';
import { searchEntries } from '../search';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock('../../reducers');
jest.mock('../../backend');
jest.mock('../../integrations');

describe('search', () => {
  describe('searchEntries', () => {
    const { currentBackend } = require('../../backend');
    const { selectIntegration } = require('../../reducers');
    const { getIntegrationProvider } = require('../../integrations');

    beforeEach(() => {
      jest.resetAllMocks();
    });
    it('should search entries using integration', async () => {
      const store = mockStore({
        collections: fromJS({ posts: { name: 'posts' }, pages: { name: 'pages' } }),
        search: fromJS({}),
      });

      selectIntegration.mockReturnValue('search_integration');
      currentBackend.mockReturnValue({});
      const response = { entries: [{ name: '1' }, { name: '' }], pagination: 1 };
      const integration = { search: jest.fn().mockResolvedValue(response) };
      getIntegrationProvider.mockReturnValue(integration);

      await store.dispatch(searchEntries('find me'));
      const actions = store.getActions();
      expect(actions).toHaveLength(2);

      expect(actions[0]).toEqual({
        type: 'SEARCH_ENTRIES_REQUEST',
        payload: {
          searchTerm: 'find me',
          page: 0,
        },
      });
      expect(actions[1]).toEqual({
        type: 'SEARCH_ENTRIES_SUCCESS',
        payload: {
          searchTerm: 'find me',
          entries: response.entries,
          page: response.pagination,
        },
      });

      expect(integration.search).toHaveBeenCalledTimes(1);
      expect(integration.search).toHaveBeenCalledWith(['posts', 'pages'], 'find me', 0);
    });

    it('should search entries using backend', async () => {
      const store = mockStore({
        collections: fromJS({ posts: { name: 'posts' }, pages: { name: 'pages' } }),
        search: fromJS({}),
      });

      const response = { entries: [{ name: '1' }, { name: '' }], pagination: 1 };
      const backend = { search: jest.fn().mockResolvedValue(response) };
      currentBackend.mockReturnValue(backend);

      await store.dispatch(searchEntries('find me'));

      const actions = store.getActions();
      expect(actions).toHaveLength(2);

      expect(actions[0]).toEqual({
        type: 'SEARCH_ENTRIES_REQUEST',
        payload: {
          searchTerm: 'find me',
          page: 0,
        },
      });
      expect(actions[1]).toEqual({
        type: 'SEARCH_ENTRIES_SUCCESS',
        payload: {
          searchTerm: 'find me',
          entries: response.entries,
          page: response.pagination,
        },
      });

      expect(backend.search).toHaveBeenCalledTimes(1);
      expect(backend.search).toHaveBeenCalledWith(
        [fromJS({ name: 'posts' }), fromJS({ name: 'pages' })],
        'find me',
      );
    });

    it('should ignore identical search', async () => {
      const store = mockStore({
        collections: fromJS({ posts: { name: 'posts' }, pages: { name: 'pages' } }),
        search: fromJS({ isFetching: true, term: 'find me' }),
      });

      await store.dispatch(searchEntries('find me'));

      const actions = store.getActions();
      expect(actions).toHaveLength(0);
    });
  });
});
