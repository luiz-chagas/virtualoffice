const mediaConstraints = {
  video: false,
  audio: true,
};

const connections: Record<string, RTCPeerConnection> = {};
const streams: Record<string, HTMLAudioElement> = {};
let myStream: Promise<MediaStream>;

export const setupHandlers = (socket: SocketIOClient.Socket) => {
  const makeOffer = async (target: string) => {
    if (connections[target]) {
      return;
    }
    const myPeerConnection = await createPeerConnection(target);
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
    const myPeerConnection = await createPeerConnection(name);
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
    socket.emit("audio-answer", {
      name: target,
      target: name,
      type: "audio-answer",
      sdp: myPeerConnection.localDescription,
    });
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
    removeStreamFromDOM(userId);
  };

  const handleAnswer = ({ name, sdp }: AnswerPayload) => {
    connections[name]?.setRemoteDescription(new RTCSessionDescription(sdp));
  };

  myStream = navigator.mediaDevices.getUserMedia(mediaConstraints);

  socket.on("audio-offer", handleOffer);
  socket.on("audio-answer", handleAnswer);
  socket.on("new-ice-candidate", handleIceCandidate);
  socket.on("hang-up", handleHangUp);

  const changeVolume = (player: string, volume: number) => {
    if (streams[player]) {
      streams[player].volume = volume;
    }
  };

  return { connectToAudio: makeOffer, changeVolume };
};

const createPeerConnection = async (target: string) => {
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
  const stream = await myStream;
  stream.getTracks().forEach((track) => connection.addTrack(track));
  connection.ontrack = (data) => {
    if (data.streams && data.streams[0]) {
      addStreamToDOM(target, data.streams[0]);
    } else {
      const newStream = new MediaStream();
      newStream.addTrack(data.track);
      addStreamToDOM(target, newStream);
    }
  };
  connection.oniceconnectionstatechange = () => {
    if (["closed", "failed"].includes(connection.iceConnectionState)) {
      removeStreamFromDOM(target);
    }
  };
  return connection;
};

const addStreamToDOM = (userId: string, stream: MediaStream) => {
  const mediaElement = document.createElement("audio");
  mediaElement.volume = 1;
  mediaElement.id = userId;
  mediaElement.srcObject = stream;
  mediaElement.autoplay = true;
  streams[userId] = mediaElement;
};

const removeStreamFromDOM = (userId: string) => {
  const mediaElement = document.getElementById(userId);
  mediaElement.remove();
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
