import { useState, useEffect } from 'react';

export const useLocalStorageState = (key, defaultValue) => {
  const localStorageKey = `netlifyCMS.${key}`;
  const [value, setValue] = useState(
    localStorage.getItem(localStorageKey)
      ? JSON.parse(localStorage.getItem(localStorageKey))
      : defaultValue,
  );

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(value));
  }, [value]);

  return [value, setValue];
};
