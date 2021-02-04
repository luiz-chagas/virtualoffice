import { Server } from "socket.io";
import { EventEmitter } from "events";
import { log } from "./logger";
import { propOr, reduceBy, values } from "ramda";

interface Player {
  id: string;
  x: number;
  y: number;
  facing: "north" | "south" | "east" | "west";
  avatar: string;
  name: string;
  room: string | null;
}

const getRandomAvatar = () => {
  const number = Math.floor(Math.random() * 4) + 1;
  return `player${number}`;
};

export const makePlayersService = (socketServer: Server) => {
  const events = new EventEmitter();
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

  const listPlayersByRoom = (players: Player[]) => {
    const getRoom = propOr("Loft", "room");
    const namesReducer = (acc: string[], player: Player) =>
      acc.concat(player.name);
    return reduceBy(namesReducer, [], getRoom, players);
  };

  events.on("listPlayersReq", () => {
    const result = listPlayersByRoom(values(players));
    events.emit("listPlayersRes", result);
  });

  socketServer.on("connection", (socket) => {
    socket.on("disconnect", () => {
      log(`${players[socket.id]?.name} has disconnected`);
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
        name: name,
        avatar: getRandomAvatar(),
        facing: "south",
        room: null,
      });
      log(`${name} has joined`);
      if (Object.keys(players).length === 1) {
        events.emit("firstPlayerJoined", name);
      }
    });
  });

  setInterval(updateGameState, 50);

  return events;
};
