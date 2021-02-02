import { config } from "dotenv";
import http from "http";
import io from "socket.io";
import { app } from "./express";
import { log } from "./services/logger";
import { makePlayersService } from "./services/players";
import { makeSignalingService } from "./services/signaling";
import { makeSlackService } from "./services/slack";

config();

const port = Number(process.env.PORT) || 8080;
app.set("port", port);

const server = new http.Server(app);
const socketServer = new io.Server(server, {
  transports: ["websocket"],
});

const playerEvents = makePlayersService(socketServer);
makeSignalingService(socketServer);
makeSlackService(playerEvents);

const onError = (error: any) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " i already in use");
      process.exit(1);
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  log("Server started on " + bind);
};

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
