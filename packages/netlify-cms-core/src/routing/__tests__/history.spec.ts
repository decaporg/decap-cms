import { createHashHistory, History } from 'history';
import { mocked } from 'ts-jest/utils';

jest.mock('history');

const history = ({ push: jest.fn(), replace: jest.fn() } as unknown) as History;
const mockedCreateHashHistory = mocked(createHashHistory);
mockedCreateHashHistory.mockReturnValue(history);

describe('history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('navigateToCollection', () => {
    it('should push route', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { navigateToCollection } = require('../history');

      navigateToCollection('posts');
      expect(history.push).toHaveBeenCalledTimes(1);
      expect(history.push).toHaveBeenCalledWith('/collections/posts');
    });
  });

  describe('navigateToNewEntry', () => {
    it('should replace route', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { navigateToNewEntry } = require('../history');

      navigateToNewEntry('posts');
      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith('/collections/posts/new');
    });
  });

  describe('navigateToEntry', () => {
    it('should replace route', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { navigateToEntry } = require('../history');

      navigateToEntry('posts', 'index');
      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith('/collections/posts/entries/index');
    });
  });
});
