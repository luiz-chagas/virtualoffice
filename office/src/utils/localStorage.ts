type AllowedParams = "char" | "playSound" | "uid" | "fps" | "world";

export const save = (x: AllowedParams, data: string | boolean | number) =>
  localStorage.setItem(x, JSON.stringify(data));

export const load = (x: AllowedParams) => {
  try {
    const value = JSON.parse(localStorage.getItem(x) ?? "");
    return value;
  } catch (err) {
    return null;
  }
};
