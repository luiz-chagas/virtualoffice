import { Server } from "socket.io";

interface Player {
  id: string;
  x: number;
  y: number;
  facing: "north" | "south" | "east" | "west";
  avatar: string;
}

const getRandomAvatar = () => {
  const number = Math.floor(Math.random() * 4) + 1;
  return `player${number}`;
};

export const makePlayersService = (socketServer: Server) => {
  const players: Record<string, Player> = {};

  const addPlayer = (socketId: string) => {
    players[socketId] = {
      id: socketId,
      x: 380,
      y: 580,
      facing: "south",
      avatar: getRandomAvatar(),
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
