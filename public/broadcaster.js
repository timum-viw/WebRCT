let peerConnection;
// const config = {
//   iceServers: [
//     {
//       urls: ["stun:stun.l.google.com:19302"]
//     }
//   ]
// };

const socket = io.connect(window.location.origin);
const video = document.querySelector("video");

// Media contrains
const constraints = {
  audio: false,
  video: { facingMode: 'environment' }
};

navigator.mediaDevices
  .getUserMedia(constraints)
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(error => socket.emit('error', error) );

socket.on("connect", () => {
  const watcher = location.hash.substring(1)
  if(!watcher) return
  document.getElementById('error').style.display = 'none'

  peerConnection = new RTCPeerConnection()

  let stream = video.srcObject;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", watcher, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", watcher, peerConnection.localDescription);
    });
});

socket.on("answer", (id, description) => {
  peerConnection.setRemoteDescription(description);
});

socket.on("candidate", (id, candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnection && peerConnection.close();
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};