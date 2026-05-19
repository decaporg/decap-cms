import deploys, { selectDeployPreview } from '../deploys';
import {
  DEPLOY_PREVIEW_REQUEST,
  DEPLOY_PREVIEW_SUCCESS,
  DEPLOY_PREVIEW_FAILURE,
} from '../../actions/deploys';

describe('deploys reducer', () => {
  it('should return the default state', () => {
    const result = deploys(undefined, { type: 'UNKNOWN' });
    expect(result).toEqual({});
  });

  describe('DEPLOY_PREVIEW_REQUEST', () => {
    it('should set isFetching to true and status to PENDING', () => {
      const result = deploys(undefined, {
        type: DEPLOY_PREVIEW_REQUEST,
        payload: { collection: 'posts', slug: 'my-post' },
      });
      expect(result['posts.my-post']).toEqual({ isFetching: true, status: 'PENDING' });
    });

    it('should clear stale url and replace status with PENDING', () => {
      const staleState = {
        'posts.my-post': {
          isFetching: false,
          url: 'https://production.example.com/posts/my-post',
          status: 'SUCCESS',
        },
      };
      const result = deploys(staleState, {
        type: DEPLOY_PREVIEW_REQUEST,
        payload: { collection: 'posts', slug: 'my-post' },
      });
      expect(result['posts.my-post']).toEqual({ isFetching: true, status: 'PENDING' });
      expect(result['posts.my-post'].url).toBeUndefined();
    });
  });

  describe('DEPLOY_PREVIEW_SUCCESS', () => {
    it('should store the deploy preview url and status', () => {
      const initialState = {
        'posts.my-post': { isFetching: true },
      };
      const result = deploys(initialState, {
        type: DEPLOY_PREVIEW_SUCCESS,
        payload: {
          collection: 'posts',
          slug: 'my-post',
          url: 'https://preview.example.com/posts/my-post',
          status: 'SUCCESS',
        },
      });
      expect(result['posts.my-post']).toEqual({
        isFetching: false,
        url: 'https://preview.example.com/posts/my-post',
        status: 'SUCCESS',
      });
    });
  });

  describe('DEPLOY_PREVIEW_FAILURE', () => {
    it('should set isFetching to false and status to PENDING', () => {
      const initialState = {
        'posts.my-post': { isFetching: true, status: 'PENDING' },
      };
      const result = deploys(initialState, {
        type: DEPLOY_PREVIEW_FAILURE,
        payload: { collection: 'posts', slug: 'my-post' },
      });
      expect(result['posts.my-post'].isFetching).toBe(false);
      expect(result['posts.my-post'].status).toBe('PENDING');
    });

    it('should clear url and replace status with PENDING to prevent stale data', () => {
      const initialState = {
        'posts.my-post': {
          isFetching: true,
          url: 'https://production.example.com/posts/my-post',
          status: 'SUCCESS',
        },
      };
      const result = deploys(initialState, {
        type: DEPLOY_PREVIEW_FAILURE,
        payload: { collection: 'posts', slug: 'my-post' },
      });
      expect(result['posts.my-post']).toEqual({
        isFetching: false,
        url: undefined,
        status: 'PENDING',
      });
    });
  });

  describe('selectDeployPreview', () => {
    it('should return the deploy preview for a given collection and slug', () => {
      const state = {
        'posts.my-post': {
          isFetching: false,
          url: 'https://preview.example.com/posts/my-post',
          status: 'SUCCESS',
        },
      };
      expect(selectDeployPreview(state, 'posts', 'my-post')).toBe(state['posts.my-post']);
    });

    it('should return undefined for unknown collection/slug', () => {
      expect(selectDeployPreview({}, 'posts', 'unknown')).toBeUndefined();
    });
  });
});
