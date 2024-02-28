const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: true,
});

const emailToSocketIdMap = new Map();
const socketIdtoEmailMap = new Map();

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

io.on("connection", (socket) => {
    console.log("Socket connected", socket.id);
    socket.on("room:join", (data) => {
        const { email, room } = data;
        console.log("Email and room");
        console.log(email,room);
        emailToSocketIdMap.set(email, socket.id);
        socketIdtoEmailMap.set(socket.id, email);
        io.to(room).emit("user:joined", { email, id: socket.id });
        socket.join(room);
        io.to(socket.id).emit("room:join", data);
    });
    socket.on("user:call", ({ to, offer }) => {
        io.to(to).emit("incoming:call", { from: socket.id, offer });
    });
    socket.on("call:accepted", ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
    });
    socket.on("peer:nego:needed", ({ to, offer }) => {
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });
    socket.on("peer:nego:done", ({ to, ans }) => {
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });
    socket.on("call:ended", ({ to }) => {
        io.to(to).emit("call:ended");
    });


    socket.on("disconnect", () => {
        console.log("Socket disconnected", socket.id);
        const email = socketIdtoEmailMap.get(socket.id);
        if (email) {
            emailToSocketIdMap.delete(email);
            socketIdtoEmailMap.delete(socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
