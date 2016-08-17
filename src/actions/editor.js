export const SWITCH_VISUAL_MODE = 'SWITCH_VISUAL_MODE';
export const REGISTER_COMPONENT = 'REGISTER_COMPONENT';

export function switchVisualMode(useVisualMode) {
  return {
    type: SWITCH_VISUAL_MODE,
    payload: useVisualMode
  };
}

export function registerComponent(options) {
  return {
    type: REGISTER_COMPONENT,
    payload: options
  };
}
