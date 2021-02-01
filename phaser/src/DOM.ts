import { getUserStream } from "./stream";

const nodes: Record<string, HTMLAudioElement | HTMLVideoElement> = {};

export const removeFromDOM = (id: string) => {
  nodes[id]?.remove();
  delete nodes[id];
};

export const addVideoToDOM = (userId: string, stream: MediaStream) => {
  if (nodes[userId]?.tagName === "VIDEO") {
    return;
  }
  if (nodes[userId]?.tagName === "AUDIO") {
    removeFromDOM(userId);
  }
  const videoContainer = document.getElementById("videos");
  const mediaElement = document.createElement("video");
  mediaElement.id = userId;
  mediaElement.srcObject = stream;
  mediaElement.autoplay = true;
  mediaElement.className = "user-video";
  nodes[userId] = mediaElement;
  videoContainer.appendChild(mediaElement);
};

export const addAudioToDOM = (userId: string, stream: MediaStream) => {
  if (nodes[userId]?.tagName === "AUDIO") {
    return;
  }
  if (nodes[userId]?.tagName === "VIDEO") {
    removeFromDOM(userId);
  }
  const audioContainer = document.getElementById("audios");
  const mediaElement = document.createElement("audio");
  mediaElement.volume = 1;
  mediaElement.id = userId;
  mediaElement.srcObject = stream;
  mediaElement.autoplay = true;
  nodes[userId] = mediaElement;
  audioContainer.appendChild(mediaElement);
};

export const makeAllAudio = () => {
  Object.entries(nodes).forEach(([id, nodeElement]) => {
    addAudioToDOM(id, nodeElement.srcObject as MediaStream);
  });
};

export const changeVolume = (userId: string, volume: number) => {
  if (nodes[userId] && nodes[userId].volume !== volume) {
    nodes[userId].volume = volume;
  }
};

export const addSelfVideoToDom = async (userId: string) => {
  removeFromDOM(userId);
  const videoContainer = document.getElementById("videos");
  const mediaElement = document.createElement("video");
  mediaElement.id = userId;
  const stream = await getUserStream();
  mediaElement.srcObject = stream;
  mediaElement.autoplay = true;
  mediaElement.volume = 0;
  mediaElement.muted = true;
  mediaElement.className = "user-video";
  nodes[userId] = mediaElement;
  videoContainer.appendChild(mediaElement);
};

export const turnAudioIntoVideo = (id: string) => {
  if (!nodes[id] || nodes[id].tagName === "VIDEO") {
    return;
  }
  const stream = nodes[id].srcObject as MediaStream;
  addVideoToDOM(id, stream);
};

export const turnVideoIntoAudio = (id: string) => {
  if (!nodes[id] || nodes[id].tagName === "AUDIO") {
    return;
  }
  const stream = nodes[id].srcObject as MediaStream;
  addAudioToDOM(id, stream);
};
