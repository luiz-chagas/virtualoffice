const mediaConstraints = {
  video: false,
  audio: true,
};

const connections: Record<string, RTCPeerConnection> = {};
let myStream: Promise<MediaStream>;

export const setupHandlers = (socket: SocketIOClient.Socket) => {
  const handleOffer = async ({ name, target, sdp }: OfferPayload) => {
    const myPeerConnection = await createPeerConnection(name);
    connections[name] = myPeerConnection;
    const desc = new RTCSessionDescription(sdp);
    await myPeerConnection.setRemoteDescription(desc);
    const answer = await myPeerConnection.createAnswer();
    await myPeerConnection.setLocalDescription(answer);
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

  const makeOffer = async (target: string) => {
    if (connections[target]) {
      return;
    }
    const myPeerConnection = await createPeerConnection(target);
    connections[target] = myPeerConnection;
    myPeerConnection.onnegotiationneeded = async () => {
      const offer = await myPeerConnection.createOffer();
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

  myStream = navigator.mediaDevices.getUserMedia(mediaConstraints);

  socket.on("audio-offer", handleOffer);
  socket.on("new-ice-candidate", handleIceCandidate);
  socket.on("hang-up", handleHangUp);

  return { makeOffer };
};

const createPeerConnection = async (target: string) => {
  const connection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });
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
