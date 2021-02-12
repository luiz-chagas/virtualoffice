type Props = "char" | "playSound" | "uid";

export const save = (x: Props, data: string | boolean) =>
  localStorage.setItem(x, JSON.stringify(data));

export const load = (x: Props) => JSON.parse(localStorage.getItem(x) ?? "");
