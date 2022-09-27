import { useEffect } from 'react';
import AlertEvent from './events/AlertEvent';
import ConfirmEvent from './events/ConfirmEvent';

interface EventMap {
  alert: AlertEvent;
  confirm: ConfirmEvent;
}

export function useWindowEvent<K extends keyof WindowEventMap>(
  eventName: K,
  callback: (event: WindowEventMap[K]) => void
): void;
export function useWindowEvent<K extends keyof EventMap>(eventName: K, callback: (event: EventMap[K]) => void): void;
export function useWindowEvent(eventName: string, callback: EventListenerOrEventListenerObject): void {
  useEffect(() => {
    window.addEventListener(eventName, callback);

    return () => {
      window.removeEventListener(eventName, callback);
    };
  }, []);
}
