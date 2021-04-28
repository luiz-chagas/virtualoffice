type Props = "char" | "playSound" | "uid" | "fps";

export const save = (x: Props, data: string | boolean | number) =>
  localStorage.setItem(x, JSON.stringify(data));

export const load = (x: Props) => {
  try {
    const value = JSON.parse(localStorage.getItem(x) ?? "");
    return value;
  } catch (err) {
    return null;
  }
};
