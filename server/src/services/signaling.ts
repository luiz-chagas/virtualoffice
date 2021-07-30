import { Server } from "socket.io";

export const makeSignalingService = (socketServer: Server) => {
  socketServer.on("connection", (socket) => {
    socket.on("signal", (data: WithTarget) => {
      socketServer.sockets.sockets.get(data.target)?.emit("signal", data);
    });

    socket.on("offer", (data: WithTarget) => {
      socketServer.sockets.sockets.get(data.target)?.emit("offer", data);
    });
  });
};

interface WithTarget {
  target: string;
}
