export interface PlayerData {
  id: string;
  x: number;
  y: number;
  avatar: string;
  name: string;
  facing: "north" | "south" | "east" | "west";
  room: string | null;
}
