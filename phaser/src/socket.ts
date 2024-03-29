import { loadStorage } from "./loadStorage";
import { io, Socket } from "socket.io-client";

export const connectToServer = () => {
  const socket =
    process.env.NODE_ENV === "development"
      ? io("localhost:8080", {
          transports: ["websocket"],
        })
      : io({
          transports: ["websocket"],
        });
  return { socket };
};

export const spawn = (socket: Socket, x: number, y: number) => {
  const name =
    new URLSearchParams(window.location.search).get("name") || "Anonymous";

  const world = loadStorage("world");

  socket.emit("join", {
    name,
    x,
    y,
    world,
    avatar: loadStorage("char"),
  });
  socket.emit("joinWorld", {
    world,
  });
};
