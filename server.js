import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve the public folder
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ----- GRID STATE -----
let gridState = Object.fromEntries([...Array(100)].map((_, i) => [i + 1, false]));

// ----- SOCKET.IO LOGIC -----
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // Send current state when client connects
  socket.emit("init", gridState);

  // Toggle cell color (grey ↔ red)
  socket.on("toggleCell", (id) => {
    gridState[id] = !gridState[id];
    io.emit("update", { id, value: gridState[id] });
  });

  // Reset all cells
  socket.on("resetGrid", () => {
    gridState = Object.fromEntries([...Array(100)].map((_, i) => [i + 1, false]));
    io.emit("reset");
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ----- HELPER: Get Local IP -----
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

// ----- START SERVER -----
const PORT = 3000;
const HOST = "0.0.0.0";

server.listen(PORT, HOST, () => {
  const localIP = getLocalIP();
  console.log("✅ Server is running!");
  console.log(`➡ Localhost:  http://localhost:${PORT}`);
  console.log(`➡ Network:    http://${localIP}:${PORT}`);
});
