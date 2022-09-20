import { produce } from 'immer';

import { SCROLL_SYNC_ENABLED, SET_SCROLL, TOGGLE_SCROLL } from '../actions/scroll';

import type { ScrollAction } from '../actions/scroll';

export type ScrollState = {
  isScrolling: boolean;
};

const defaultState: ScrollState = {
  isScrolling: true,
};

const status = produce((state: ScrollState, action: ScrollAction) => {
  switch (action.type) {
    case TOGGLE_SCROLL:
      state.isScrolling = !state.isScrolling;
      localStorage.setItem(SCROLL_SYNC_ENABLED, `${state.isScrolling}`);
      break;
    case SET_SCROLL:
      state.isScrolling = action.payload;
      localStorage.setItem(SCROLL_SYNC_ENABLED, `${state.isScrolling}`);
      break;
  }
}, defaultState);

export default status;
