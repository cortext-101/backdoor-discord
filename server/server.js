import express from "express";
import http from "http";
import { Server } from "socket.io";
import { servers, users } from "./data.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("../public"));

// --- Socket.IO connection ---
io.on("connection", socket => {
  console.log(`User connected: ${socket.id}`);

  // Set default user
  users[socket.id] = { username: socket.id.slice(0, 4), currentServer: null, currentChannel: null };

  // Send existing servers
  socket.emit("servers", servers);

  // Create a new server
  socket.on("createServer", name => {
    const id = "s" + Date.now();
    servers[id] = { name, channels: {}, users: [] };
    io.emit("servers", servers);
  });

  // Join a server
  socket.on("joinServer", serverId => {
    users[socket.id].currentServer = serverId;
    users[socket.id].currentChannel = null;
    servers[serverId].users.push(socket.id);
    socket.emit("channels", servers[serverId].channels);
  });

  // Create a channel
  socket.on("createChannel", ({ serverId, name }) => {
    const channelId = "c" + Date.now();
    servers[serverId].channels[channelId] = { name, messages: [] };
    io.to(socket.id).emit("channels", servers[serverId].channels);
    io.emit("servers", servers); // optional update
  });

  // Join a channel
  socket.on("joinChannel", channelId => {
    users[socket.id].currentChannel = channelId;
    const serverId = users[socket.id].currentServer;
    socket.emit("messages", servers[serverId].channels[channelId].messages);
  });

  // Send message
  socket.on("message", msg => {
    const user = users[socket.id];
    const serverId = user.currentServer;
    const channelId = user.currentChannel;
    if (!serverId || !channelId) return;
    const message = { from: user.username, text: msg, time: Date.now() };
    servers[serverId].channels[channelId].messages.push(message);
    io.emit("message", { serverId, channelId, message });
  });

  // Screen sharing / video signaling
  socket.on("signal", data => {
    socket.to(data.to).emit("signal", { from: socket.id, ...data });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const user = users[socket.id];
    if (user?.currentServer) {
      const serverUsers = servers[user.currentServer].users;
      servers[user.currentServer].users = serverUsers.filter(id => id !== socket.id);
    }
    delete users[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
