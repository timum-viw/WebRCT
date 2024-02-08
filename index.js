const express = require("express");
const app = express();

const port = process.env.VIRTUAL_PORT || 8765;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => console.log(e));

io.sockets.on("connection", socket => {
  socket.on("error", e => console.log(e));

  socket.on("disconnect", () => {
    socket.broadcaster && socket.to(socket.broadcaster).emit("disconnectPeer", socket.id);
    socket.watcher && socket.to(socket.watcher).emit("disconnectPeer", socket.id);
  });

  socket.on("offer", (id, message) => {
    const w = io.of('/').sockets.get( id )
    if(!w) return
    w.broadcaster = socket.id
    console.debug(`${socket.id} offering to ${id}`)
    socket.to(id).emit("offer", socket.id, message);
  });

  socket.on("answer", (id, message) => {
    const b = io.of('/').sockets.get( id )
    if(!b) return 
    b.watcher = socket.id
    console.debug(`${socket.id} answering to ${id}`)
    socket.to(id).emit("answer", socket.id, message);
  });

  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
});

server.listen(port, () => console.log(`Server is running on port ${port}`));
