import history from '../routing/history';

export const SWITCH_VISUAL_MODE = 'SWITCH_VISUAL_MODE';
export const CLOSED_ENTRY = 'CLOSED_ENTRY';

export function switchVisualMode(useVisualMode) {
  return {
    type: SWITCH_VISUAL_MODE,
    payload: useVisualMode,
  };
}

export function closeEntry(collection) {
  return (dispatch) => {
    if (collection && collection.get('name', false)) {
      history.push(`collections/${ collection.get('name') }`);
    } else {
      history.goBack();
    }
    dispatch({ type: CLOSED_ENTRY });
  };
}
