export const SWITCH_VISUAL_MODE = 'SWITCH_VISUAL_MODE';

export function switchVisualMode(useVisualMode) {
  return {
    type: SWITCH_VISUAL_MODE,
    payload: useVisualMode
  };
}
