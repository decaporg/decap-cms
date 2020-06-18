jest.mock('history');

describe('history', () => {
  const { createHashHistory } = require('history');
  const history = { push: jest.fn(), replace: jest.fn() };
  createHashHistory.mockReturnValue(history);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('navigateToCollection', () => {
    it('should push route', () => {
      const { navigateToCollection } = require('../history');

      navigateToCollection('posts');

      expect(history.push).toHaveBeenCalledTimes(1);
      expect(history.push).toHaveBeenCalledWith('/collections/posts');
    });
  });

  describe('navigateToNewEntry', () => {
    it('should replace route', () => {
      const { navigateToNewEntry } = require('../history');

      navigateToNewEntry('posts');

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith('/collections/posts/new');
    });
  });

  describe('navigateToEntry', () => {
    it('should replace route', () => {
      const { navigateToEntry } = require('../history');

      navigateToEntry('posts', 'index');

      expect(history.replace).toHaveBeenCalledTimes(1);
      expect(history.replace).toHaveBeenCalledWith('/collections/posts/entries/index');
    });
  });
});
