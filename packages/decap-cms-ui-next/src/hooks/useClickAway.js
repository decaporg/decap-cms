import { useEffect } from 'react';

function useClickAway(ref, handler) {
  useEffect(() => {
    function listener(event) {
      const element = ref.current;

      if (!element || element.contains(event.target)) {
        return;
      }

      handler(event);
    }

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export default useClickAway;
