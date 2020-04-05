import { produce } from 'immer';
import {
  HISTORY_REQUEST,
  HISTORY_SUCCESS,
  HISTORY_FAILURE,
  ADD_HISTORY_ITEM_REQUEST,
  ADD_HISTORY_ITEM_SUCCESS,
  ADD_HISTORY_ITEM_FAILURE,
  REMOVE_HISTORY_ITEM_REQUEST,
  REMOVE_HISTORY_ITEM_SUCCESS,
  REMOVE_HISTORY_ITEM_FAILURE,
} from '../actions/history';
import { HistoryState, HistoryAction, EntryHistoryState } from '../types/redux';

const collections = (state: HistoryState = {}, action: HistoryAction) => {
  switch (action.type) {
    case HISTORY_REQUEST: {
      const { collection, slug } = action.payload;

      const nextState = produce(state, draftState => {
        if (draftState[`${collection}.${slug}`]) {
          draftState[`${collection}.${slug}`]!.isFetching = false;
        } else {
          draftState[`${collection}.${slug}`] = { items: [], isFetching: false };
        }
      });
      return nextState;
    }
    case HISTORY_SUCCESS: {
      const { collection, slug, history } = action.payload;

      const nextState = produce(state, draftState => {
        draftState[`${collection}.${slug}`]!.items = history!.items;
        draftState[`${collection}.${slug}`]!.isFetching = false;
      });
      return nextState;
    }
    case HISTORY_FAILURE: {
      const { collection, slug, error } = action.payload;

      const nextState = produce(state, draftState => {
        draftState[`${collection}.${slug}`] = { items: [], error, isFetching: false };
      });
      return nextState;
    }
    case ADD_HISTORY_ITEM_REQUEST:
    case REMOVE_HISTORY_ITEM_REQUEST: {
      return state;
    }
    case ADD_HISTORY_ITEM_SUCCESS:
    case REMOVE_HISTORY_ITEM_SUCCESS: {
      const { collection, slug, history } = action.payload;

      const nextState = produce(state, draftState => {
        draftState[`${collection}.${slug}`]!.items = history!.items;
      });
      return nextState;
    }
    case ADD_HISTORY_ITEM_FAILURE:
    case REMOVE_HISTORY_ITEM_FAILURE: {
      return state;
    }
    default:
      return state;
  }
};

export const selectEntryHistory = (
  state: HistoryState,
  collection: string,
  slug: string,
): EntryHistoryState => {
  const history = state[`${collection}.${slug}`];
  return history || { items: [], isFetching: false };
};

export default collections;
