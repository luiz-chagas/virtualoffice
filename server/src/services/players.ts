import { Server } from "socket.io";

interface Player {
  id: string;
  x: number;
  y: number;
  facing: "north" | "south" | "east" | "west";
}

export const makePlayersService = (socketServer: Server) => {
  const players: Record<string, Player> = {};

  const addPlayer = (socketId: string) => {
    players[socketId] = {
      id: socketId,
      x: 0,
      y: 0,
      facing: "south",
    };
  };

  const removePlayer = (socketId: string) => {
    delete players[socketId];
  };

  const updatePlayer = (socketId: string, playerData: Player) => {
    players[socketId] = Object.assign({}, players[socketId], playerData);
  };

  const updateGameState = () => {
    socketServer.emit("stateUpdate", players);
  };

  socketServer.on("connection", (socket) => {
    if (!socket.request.headers.origin) {
      return;
    }

    addPlayer(socket.id);

    socket.on("disconnect", () => {
      removePlayer(socket.id);
    });

    socket.on("error", () => {
      removePlayer(socket.id);
    });

    socket.on("move", (playerData: Player) => {
      updatePlayer(socket.id, playerData);
    });
  });

  setInterval(updateGameState, 33);

  return;
};
