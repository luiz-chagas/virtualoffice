import { clone, values } from "ramda";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";

interface World {
  name: string;
  id: string;
  players: string[];
  lastActivity: number;
}

const defaultWorld: World = {
  name: "Crema Loft",
  id: "crema-office",
  players: [],
  lastActivity: Date.now(),
};

export const makeWorldsService = (socketServer: Server) => {
  const worlds: Record<string, World> = {
    [defaultWorld.id]: defaultWorld,
  };

  const playersInWorlds: Record<string, string> = {};

  const removeWorld = (worldId: string) => {
    delete worlds[worldId];
  };

  const addWorld = (world: World) => {
    worlds[world.id] = world;
  };

  const addPlayerToWorld = (worldId: string, playerId: string) => {
    if (!worlds[worldId]) return;
    worlds[worldId].players.push(playerId);
    worlds[worldId].lastActivity = Date.now();
    playersInWorlds[playerId] = worldId;
  };

  const removePlayer = (playerId: string) => {
    const worldId = playersInWorlds[playerId];
    const world = worlds[worldId];
    if (world) {
      world.players = world.players.filter((player) => player !== playerId);
    }
  };

  const updateWorldsList = () => {
    const currentWorld = clone(worlds);
    values(currentWorld).forEach((world) => {
      if (
        world.players.length === 0 &&
        world.id !== defaultWorld.id &&
        Date.now() > world.lastActivity + 1000 * 60 * 5
      ) {
        removeWorld(world.id);
      }
    });
    socketServer.emit("worlds", worlds);
  };

  socketServer.on("connection", (socket) => {
    socket.on("createWorld", ({ name }: Partial<World>) => {
      const newWorld: World = {
        id: uuidv4(),
        name: name ?? "Unknown",
        players: [],
        lastActivity: Date.now(),
      };

      addWorld(newWorld);
    });

    socket.on("listWorlds", () => {
      socket.emit("worlds", worlds);
    });

    socket.on("joinWorld", ({ world }) => {
      addPlayerToWorld(world, socket.id);
    });

    socket.on("disconnect", () => {
      removePlayer(socket.id);
    });
  });

  setInterval(updateWorldsList, 1000);
};
