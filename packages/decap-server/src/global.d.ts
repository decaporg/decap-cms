type LocalForage = {
  getItem: <T>(key: string) => Promise<T>;
  setItem: <T>(key: string, value: T) => Promise<void>;
};
