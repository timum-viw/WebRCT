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
  video: { facingMode: 'rear' }
};

navigator.mediaDevices
  .getUserMedia(constraints)
  .then(stream => {
    document.getElementById("connect").style = "display: block"
    video.srcObject = stream;
  })
  .catch(error => socket.emit('error', error) );

socket.on("watcher", id => {
  peerConnection = new RTCPeerConnection();

  let stream = video.srcObject;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
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

window.connect = () => {
  const value = document.querySelector("input").value
  socket.emit("broadcaster", value)
}