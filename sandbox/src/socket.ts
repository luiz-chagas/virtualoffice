export const connectToServer = () => {
  const socket = io({
    transports: ["websocket"],
  });
  return { socket };
};
