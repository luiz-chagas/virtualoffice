import { Server } from "socket.io";

export const makeSignalingService = (socketServer: Server) => {
  socketServer.on("connection", (socket) => {
    socket.on("audio-offer", (data: WithTarget) => {
      socketServer.sockets.sockets.get(data.target)?.emit("audio-offer", data);
    });

    socket.on("audio-answer", (data: WithTarget) => {
      socketServer.sockets.sockets.get(data.target)?.emit("audio-answer", data);
    });

    socket.on("new-ice-candidate", (data: WithTarget) => {
      socketServer.sockets.sockets
        .get(data.target)
        ?.emit("new-ice-candidate", data);
    });
  });
};

interface WithTarget {
  target: string;
}
