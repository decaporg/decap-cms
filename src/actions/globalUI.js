export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';
export const OPEN_SIDEBAR = 'OPEN_SIDEBAR';

export function toggleSidebar() {
  return { type: TOGGLE_SIDEBAR };
}

export function openSidebar(open = false) {
  return {
    type: OPEN_SIDEBAR,
    payload: { open },
  };
}
