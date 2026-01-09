const socket = io();

const serversDiv = document.getElementById("servers");
const channelsDiv = document.getElementById("channels");
const messagesDiv = document.getElementById("messages");
let currentServer = null;
let currentChannel = null;

// --- Servers ---
socket.on("servers", data => {
  serversDiv.innerHTML = "";
  for (const id in data) {
    const btn = document.createElement("button");
    btn.textContent = data[id].name;
    btn.onclick = () => joinServer(id);
    serversDiv.appendChild(btn);
  }
});

function createServer() {
  const name = document.getElementById("newServer").value;
  if (!name) return;
  socket.emit("createServer", name);
  document.getElementById("newServer").value = "";
}

function joinServer(id) {
  currentServer = id;
  socket.emit("joinServer", id);
}

// --- Channels ---
socket.on("channels", data => {
  channelsDiv.innerHTML = "";
  for (const id in data) {
    const btn = document.createElement("button");
    btn.textContent = data[id].name;
    btn.onclick = () => joinChannel(id);
    channelsDiv.appendChild(btn);
  }
});

function createChannel() {
  const name = document.getElementById("newChannel").value;
  if (!name || !currentServer) return;
  socket.emit("createChannel", { serverId: currentServer, name });
  document.getElementById("newChannel").value = "";
}

function joinChannel(id) {
  currentChannel = id;
  socket.emit("joinChannel", id);
}

// --- Messages ---
socket.on("messages", data => {
  messagesDiv.innerHTML = "";
  data.forEach(m => addMessage(m));
});

socket.on("message", data => {
  if (data.serverId === currentServer && data.channelId === currentChannel) {
    addMessage(data.message);
  }
});

function addMessage(m) {
  const div = document.createElement("div");
  div.textContent = `[${m.from}] ${m.text}`;
  messagesDiv.appendChild(div);
}

function sendMessage() {
  const msg = document.getElementById("msg").value;
  if (!msg) return;
  socket.emit("message", msg);
  document.getElementById("msg").value = "";
}

// --- Screen sharing ---
const video = document.getElementById("screen");
let peer;
async function startScreenShare() {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  video.srcObject = stream;
  // TODO: implement peer signaling for multiple viewers
}
