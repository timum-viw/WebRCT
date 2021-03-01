const express = require("express");
const app = express();

const port = 8765;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => console.log(e));

let broadcaster

io.sockets.on("connection", socket => {
  socket.on("error", e => console.log(e));
  
  socket.on("broadcaster", ( secret ) => {
    console.log('broadcaster ' + secret)
    socket.to(secret).emit("broadcaster", socket.id);
  });
  socket.on("watcher", ({ secret }) => {
    socket.join( secret )
  });
  socket.on("watch", (id) => {
    socket.to( id ).emit("watcher", socket.id)
  });
  socket.on("disconnect", () => {
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
});

server.listen(port, () => console.log(`Server is running on port ${port}`));