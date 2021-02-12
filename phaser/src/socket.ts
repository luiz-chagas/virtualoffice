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

export const spawn = (socket: SocketIOClient.Socket, x: number, y: number) => {
  const name =
    new URLSearchParams(window.location.search).get("name") || "Anonymous";
  socket.emit("join", {
    name,
    x,
    y,
    avatar: load("char"),
  });
};

const load = (x: string) => {
  try {
    const value = JSON.parse(localStorage.getItem(x) ?? "");
    return value;
  } catch (err) {
    return null;
  }
};
