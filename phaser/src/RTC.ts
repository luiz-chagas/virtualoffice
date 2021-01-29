const connections: Record<string, RTCPeerConnection> = {};
const streams: Record<string, HTMLAudioElement | HTMLVideoElement> = {};
const peerStreams: Record<string, MediaStream> = {};
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

  myStream = navigator.mediaDevices.getUserMedia({
    audio: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
    },
    video: {
      aspectRatio: {
        ideal: 1.777777778,
      },
      frameRate: {
        max: 30,
      },
    },
  });

  socket.on("audio-offer", handleOffer);
  socket.on("audio-answer", handleAnswer);
  socket.on("new-ice-candidate", handleIceCandidate);
  socket.on("hang-up", handleHangUp);

  return { connectToRTC: makeOffer };
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
  stream.getTracks().forEach((track) => connection.addTrack(track, stream));
  connection.ontrack = (data) => {
    const streamObj =
      peerStreams[target] || data.streams[0] || new MediaStream();
    streamObj.addTrack(data.track);
    peerStreams[target] = streamObj;
    addAudioToDOM(target, peerStreams[target]);
  };
  connection.oniceconnectionstatechange = () => {
    if (["closed", "failed"].includes(connection.iceConnectionState)) {
      removeStreamFromDOM(target);
    }
  };
  return connection;
};

export const changeVolume = (player: string, volume: number) => {
  if (streams[player]) {
    streams[player].volume = volume;
  }
};

const addAudioToDOM = (userId: string, stream: MediaStream) => {
  removeStreamFromDOM(userId);
  const audioContainer = document.getElementById("audios");
  const mediaElement = document.createElement("audio");
  audioContainer.appendChild(mediaElement);
  mediaElement.volume = 1;
  mediaElement.id = userId;
  mediaElement.srcObject = stream;
  mediaElement.autoplay = true;
  streams[userId] = mediaElement;
};

const addVideoToDOM = (userId: string, stream: MediaStream) => {
  removeStreamFromDOM(userId);
  const videoContainer = document.getElementById("videos");
  const mediaElement = document.createElement("video");
  videoContainer.appendChild(mediaElement);
  mediaElement.id = userId;
  mediaElement.srcObject = stream;
  mediaElement.autoplay = true;
  mediaElement.className = "user-video";
  streams[userId] = mediaElement;
};

export const promoteToVideo = (userId: string) => {
  if (streams[userId]?.tagName === "VIDEO") {
    return;
  }
  addVideoToDOM(userId, peerStreams[userId]);
};

export const demoteToAudio = (userId: string) => {
  if (streams[userId]?.tagName === "AUDIO") {
    return;
  }
  addAudioToDOM(userId, peerStreams[userId]);
};

export const demoteAllToAudio = () => {
  document.querySelectorAll("video").forEach((videoEl) => {
    addAudioToDOM(videoEl.id, peerStreams[videoEl.id]);
  });
};

export const addSelfVideoToDom = (userId: string) => {
  removeStreamFromDOM(userId);
  const videoContainer = document.getElementById("videos");
  const mediaElement = document.createElement("video");
  videoContainer.appendChild(mediaElement);
  mediaElement.id = userId;
  myStream.then((stream) => {
    mediaElement.srcObject = stream;
  });
  mediaElement.autoplay = true;
  mediaElement.volume = 0;
  mediaElement.muted = true;
  mediaElement.className = "user-video";
  streams[userId] = mediaElement;
};

export const removeStreamFromDOM = (userId: string) => {
  document
    .querySelectorAll(`[id="${userId}"]`)
    .forEach((element) => element.remove());
};

const toggleMute = (isMuted: boolean) => {
  myStream.then((stream) => {
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  });
};

export const muteVoice = () => toggleMute(true);
export const unmuteVoice = () => toggleMute(false);

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
