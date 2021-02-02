import { addAudioToDOM, removeFromDOM } from "./DOM";
import { getUserStream } from "./stream";

const connections: Record<string, RTCPeerConnection> = {};
const peerStreams: Record<string, MediaStream> = {};

export const setupHandlers = (socket: SocketIOClient.Socket) => {
  const makeOffer = async (target: string) => {
    if (connections[target]) {
      return;
    }

    const myPeerConnection = createPeerConnection(target);

    myPeerConnection.onnegotiationneeded = async () => {
      const offer = await myPeerConnection.createOffer();
      if (myPeerConnection.signalingState !== "stable") {
        return;
      }
      await myPeerConnection.setLocalDescription(offer);
      socket.emit("audio-offer", {
        name: socket.id,
        target: target,
        type: "audio-offer",
        sdp: myPeerConnection.localDescription,
      });
    };
    myPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("new-ice-candidate", {
          type: "new-ice-candidate",
          name: socket.id,
          target: target,
          candidate: event.candidate,
        });
      }
    };
  };

  const handleOffer = async ({ name, target, sdp }: OfferPayload) => {
    const myPeerConnection = createPeerConnection(name);
    const desc = new RTCSessionDescription(sdp);
    if (myPeerConnection.signalingState !== "stable") {
      // Set the local and remove descriptions for rollback; don't proceed
      // until both return.
      await Promise.all([
        myPeerConnection.setLocalDescription({ type: "rollback" }),
        myPeerConnection.setRemoteDescription(desc),
      ]);
      return;
    } else {
      await myPeerConnection.setRemoteDescription(desc);
    }
    const answer = await myPeerConnection.createAnswer();
    await myPeerConnection.setLocalDescription(answer);
    socket.emit("audio-answer", {
      name: target,
      target: name,
      type: "audio-answer",
      sdp: myPeerConnection.localDescription,
    });

    myPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("new-ice-candidate", {
          type: "new-ice-candidate",
          name: target,
          target: name,
          candidate: event.candidate,
        });
      }
    };
    myPeerConnection.onnegotiationneeded = async () => {
      const offer = await myPeerConnection.createOffer();
      if (myPeerConnection.signalingState !== "stable") {
        return;
      }
      await myPeerConnection.setLocalDescription(offer);
      socket.emit("audio-offer", {
        name: target,
        target: name,
        type: "audio-offer",
        sdp: myPeerConnection.localDescription,
      });
    };
  };

  socket.on("audio-offer", handleOffer);
  socket.on("audio-answer", handleAnswer);
  socket.on("new-ice-candidate", handleIceCandidate);
  socket.on("hang-up", handleHangUp);

  return { connectToRTC: makeOffer };
};

const handleIceCandidate = ({
  name,
  candidate,
}: {
  name: string;
  candidate: RTCIceCandidate;
}) => {
  connections[name]?.addIceCandidate(new RTCIceCandidate(candidate));
};

const handleHangUp = ({ userId }: { userId: string }) => {
  removeFromDOM(userId);
};

const handleAnswer = ({ name, sdp }: AnswerPayload) => {
  connections[name]?.setRemoteDescription(new RTCSessionDescription(sdp));
};

const createPeerConnection = (target: string) => {
  if (connections[target]) {
    return connections[target];
  }

  const connection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });

  connections[target] = connection;

  connection.ontrack = (data) => {
    const streamObj =
      peerStreams[target] || data.streams[0] || new MediaStream();
    streamObj.addTrack(data.track);
    peerStreams[target] = streamObj;
    addAudioToDOM(target, peerStreams[target]);
  };

  connection.oniceconnectionstatechange = () => {
    if (["closed", "failed"].includes(connection.iceConnectionState)) {
      removeFromDOM(target);
    }
  };

  getUserStream().then((stream) => {
    stream.getTracks().forEach((track) => connection.addTrack(track, stream));
  });

  return connection;
};

interface NegotiationPayload {
  name: string;
  target: string;
  sdp: RTCSessionDescription;
}

interface OfferPayload extends NegotiationPayload {
  type: "audio-offer";
}

interface AnswerPayload extends NegotiationPayload {
  type: "audio-answer";
}
