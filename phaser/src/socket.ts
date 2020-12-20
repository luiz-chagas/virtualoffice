export const connectToServer = () => {
  const socket =
    process.env.NODE_ENV === "development"
      ? io("localhost:8080", {
          transports: ["websocket"],
        })
      : io({
          transports: ["websocket"],
        });
  updatePlayerName(socket);
  return { socket };
};

const updatePlayerName = (socket: SocketIOClient.Socket) => {
  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get("name");
  if (name) {
    return socket.emit("name", name);
  }
  setTimeout(() => updatePlayerName(socket), 100);
};
