import { Server } from "socket.io";

export const makeSignalingService = (socketServer: Server) => {
  socketServer.on("connection", (socket) => {
    socket.on("rtc-offer", (data: WithTarget) => {
      socketServer.sockets.sockets.get(data.target)?.emit("rtc-offer", data);
    });

    socket.on("rtc-answer", (data: WithTarget) => {
      socketServer.sockets.sockets.get(data.target)?.emit("rtc-answer", data);
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
