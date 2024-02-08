import { useState, useEffect } from 'react';

export default function useLocalStorageState(key, defaultValue) {
  const localStorageKey = `decapCMS.${key}`;
  const [value, setValue] = useState(
    localStorage.getItem(localStorageKey)
      ? JSON.parse(localStorage.getItem(localStorageKey))
      : defaultValue,
  );

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(value));
  }, [value]);

  return [value, setValue];
}
