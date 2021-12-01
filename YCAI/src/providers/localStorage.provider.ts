const getItem =
  <T = any>(key: string) =>
  (): T | null => {
    const result = window.localStorage.getItem(key);
    if (typeof result === 'string') {
      return JSON.parse(result);
    }
    return result;
  };

const setItem =
  <T>(key: string, value: T) =>
  (): void => {
    return window.localStorage.setItem(key, JSON.stringify(value));
  };

export { getItem, setItem };
