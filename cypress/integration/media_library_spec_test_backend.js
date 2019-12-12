import fixture from './media/media_library';

const entries = [
  {
    title: 'first title',
    body: 'first body',
  },
];

describe('Test Backend Media Library', () => {
  fixture({ backend: 'test', entries });
});
