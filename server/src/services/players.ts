import { Server } from "socket.io";

interface Player {
  id: string;
  x: number;
  y: number;
  facing: "north" | "south" | "east" | "west";
  avatar: string;
  name: string;
}

const getRandomAvatar = () => {
  const number = Math.floor(Math.random() * 4) + 1;
  return `player${number}`;
};

export const makePlayersService = (socketServer: Server) => {
  const players: Record<string, Player> = {};

  const removePlayer = (socketId: string) => {
    delete players[socketId];
  };

  const updatePlayer = (socketId: string, playerData: Partial<Player>) => {
    players[socketId] = Object.assign({}, players[socketId], playerData);
  };

  const updateGameState = () => {
    socketServer.emit("stateUpdate", players);
  };

  socketServer.on("connection", (socket) => {
    socket.on("disconnect", () => {
      removePlayer(socket.id);
    });

    socket.on("error", () => {
      removePlayer(socket.id);
    });

    socket.on("move", (playerData: Player) => {
      updatePlayer(socket.id, playerData);
    });

    socket.on("join", ({ name, x, y }: Player) => {
      updatePlayer(socket.id, {
        id: socket.id,
        x,
        y,
        name: name.trim().substring(0, 12),
        avatar: getRandomAvatar(),
        facing: "south",
      });
    });
  });

  setInterval(updateGameState, 33);

  return;
};
