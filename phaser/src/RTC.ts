import { Socket } from "socket.io-client";
import Peer from "simple-peer";
import { addVideoToDOM, removeFromDOM } from "./DOM";
import { getUserStream } from "./stream";

const connections: Record<string, Peer.Instance> = {};
const peerStreams: Record<string, MediaStream> = {};

export const setupHandlers = (socket: Socket) => {
  socket.on("signal", ({ data, name }: SignalPayload) => {
    connections[name]?.signal(data);
  });

  const handleOffer = async ({ name, target }: OfferPayload) => {
    const myPeerConnection = await createPeerConnection(name, false);

    myPeerConnection.on("signal", (data) => {
      socket.emit("signal", {
        target: name,
        name: target,
        type: "signal",
        data,
      });
    });
  };

  socket.on("offer", handleOffer);

  const makeOffer = async (target: string) => {
    if (connections[target]) {
      return;
    }

    const myPeerConnection = await createPeerConnection(target, true);

    socket.emit("offer", {
      target: target,
      name: socket.id,
      type: "offer",
    });

    myPeerConnection.on("signal", (data) => {
      socket.emit("signal", {
        target: target,
        name: socket.id,
        type: "signal",
        data,
      });
    });
  };

  return { connectToRTC: makeOffer };
};

const createPeerConnection = async (target: string, initiator: boolean) => {
  if (connections[target]) {
    return connections[target];
  }

  const stream = await getUserStream();

  const peer = new Peer({ initiator, stream });

  connections[target] = peer;

  peer.on("stream", (stream) => {
    peerStreams[target] = stream;
    addVideoToDOM(target, peerStreams[target]);
  });

  peer.on("end", () => {
    removeFromDOM(target);
  });

  peer.on("close", () => {
    removeFromDOM(target);
  });

  return peer;
};

interface SignalPayload {
  name: string;
  target: string;
  type: "signal";
  data: Peer.SignalData;
}

interface OfferPayload {
  name: string;
  target: string;
  type: "offer";
}
