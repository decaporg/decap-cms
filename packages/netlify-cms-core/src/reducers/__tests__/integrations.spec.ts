import { fromJS } from 'immutable';
import integrations from '../integrations';
import { CONFIG_SUCCESS } from '../../actions/config';

describe('integrations', () => {
  it('should return default state when no integrations', () => {
    const result = integrations(null, {
      type: CONFIG_SUCCESS,
      payload: fromJS({ integrations: [] }),
    });
    expect(result && result.toJS()).toEqual({
      providers: {},
      hooks: {},
    });
  });

  it('should return hooks and providers map when has integrations', () => {
    const result = integrations(null, {
      type: CONFIG_SUCCESS,
      payload: fromJS({
        integrations: [
          {
            hooks: ['listEntries'],
            collections: '*',
            provider: 'algolia',
            applicationID: 'applicationID',
            apiKey: 'apiKey',
          },
          {
            hooks: ['listEntries'],
            collections: ['posts'],
            provider: 'algolia',
            applicationID: 'applicationID',
            apiKey: 'apiKey',
          },
          {
            hooks: ['assetStore'],
            provider: 'assetStore',
            getSignedFormURL: 'https://asset.store.com/signedUrl',
          },
        ],
        collections: [{ name: 'posts' }, { name: 'pages' }, { name: 'faq' }],
      }),
    });

    expect(result && result.toJS()).toEqual({
      providers: {
        algolia: {
          applicationID: 'applicationID',
          apiKey: 'apiKey',
        },
        assetStore: {
          getSignedFormURL: 'https://asset.store.com/signedUrl',
        },
      },
      hooks: {
        posts: {
          listEntries: 'algolia',
        },
        pages: {
          listEntries: 'algolia',
        },
        faq: {
          listEntries: 'algolia',
        },
        assetStore: 'assetStore',
      },
    });
  });
});
