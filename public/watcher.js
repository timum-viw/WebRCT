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

socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection();
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = event => {
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

const create = () => {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  const secret = Array.from(array).map (b => b.toString (16).padStart (2, "0")).join ("");
  socket.emit("watcher", { secret });
  const qrCode = new QRCodeStyling({
    width: 300,  
    height: 300,
    data: secret,
  });
  qrCode.append(document.getElementById("qr"))
  document.getElementById("secret").innerText = secret
  document.getElementById("connect").style.display = 'flex'
}

socket.on("connect", () => {
  const broadcaster = localStorage.getItem('broadcaster')
  if(broadcaster) {
    socket.emit("watch", broadcaster, answer => {
      if(!answer) create()
    })
    return
  }
  else
    create()
});

socket.on("broadcaster", (id) => {
  localStorage.setItem('broadcaster', id)
  socket.emit("watch", id);
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection && peerConnection.close();
};
