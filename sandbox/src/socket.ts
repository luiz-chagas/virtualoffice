export const connectToServer = () => {
  const socket =
    process.env.NODE_ENV === "development"
      ? io("localhost:8080", {
          transports: ["websocket"],
        })
      : io({
          transports: ["websocket"],
        });
  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get("name");
  socket.emit("name", name);
  return { socket };
};
