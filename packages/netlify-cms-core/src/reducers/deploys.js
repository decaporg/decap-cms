import { Map, fromJS } from 'immutable';
import {
  DEPLOY_PREVIEW_REQUEST,
  DEPLOY_PREVIEW_SUCCESS,
  DEPLOY_PREVIEW_FAILURE,
} from 'Actions/deploys';

const deploys = (state = Map({ deploys: Map() }), action) => {
  switch (action.type) {
    case DEPLOY_PREVIEW_REQUEST: {
      const { collection, slug } = action.payload;
      return state.setIn(['deploys', `${collection}.${slug}`, 'isFetching'], true);
    }

    case DEPLOY_PREVIEW_SUCCESS: {
      const { collection, slug, url, status } = action.payload;
      return state.setIn(
        ['deploys', `${collection}.${slug}`],
        fromJS({
          isFetching: false,
          url,
          status,
        }),
      );
    }

    case DEPLOY_PREVIEW_FAILURE: {
      const { collection, slug } = action.payload;
      return state.setIn(
        ['deploys', `${collection}.${slug}`],
        fromJS({
          isFetching: false,
        }),
      );
    }

    default:
      return state;
  }
};

export const selectDeployPreview = (state, collection, slug) =>
  state.getIn(['deploys', `${collection}.${slug}`]);

export default deploys;
