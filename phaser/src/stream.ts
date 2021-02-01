let userStream: MediaStream | null;
export const getUserStream = async () => {
  if (!userStream) {
    userStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: {
        aspectRatio: 1.777777778,
        frameRate: 20,
        width: 480,
        height: 272,
      },
    });
  }
  return userStream;
};

const setAudioEnabled = async (isEnabled: boolean) => {
  const stream = await getUserStream();
  stream.getAudioTracks().forEach((track) => {
    track.enabled = isEnabled;
  });
};

const setVideoEnabled = async (isEnabled: boolean) => {
  const stream = await getUserStream();
  stream.getVideoTracks().forEach((track) => {
    track.enabled = isEnabled;
  });
};

export const muteVoice = () => setAudioEnabled(false);
export const unmuteVoice = () => setAudioEnabled(true);
export const stopVideo = () => setVideoEnabled(false);
export const startVideo = () => setVideoEnabled(true);
