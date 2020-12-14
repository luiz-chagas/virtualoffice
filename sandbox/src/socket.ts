export const connectToServer = () => {
  const socket = io("localhost:8080", {
    transports: ["websocket"],
  });
  return { socket };
};
