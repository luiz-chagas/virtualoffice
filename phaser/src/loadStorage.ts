export const loadStorage = (x: string) => {
  try {
    const value = JSON.parse(localStorage.getItem(x) ?? "");
    return value;
  } catch (err) {
    return null;
  }
};
