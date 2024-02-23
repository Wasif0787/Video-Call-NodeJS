const { Server } = require("socket.io");

const io = new Server(3000, {
    cors: true
});

const emailToSocketIdMap = new Map();
const socketIdtoEmailMap = new Map();

io.on("connection", (socket) => {
    console.log("Socket connected", socket.id);
    socket.on("room:join", (data) => {
        const { email, room } = data
        emailToSocketIdMap.set(email, socket.id);
        socketIdtoEmailMap.set(socket.id, email);
        io.to(room).emit("user:joined", { email, id: socket.id });
        socket.join(room);
        io.to(socket.id).emit("room:join", data)
    })
    socket.on("user:call", ({ to, offer }) => {
        io.to(to).emit("incoming:call", { from: socket.id, offer })
    })
    socket.on("call:accepted", ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
    });
    socket.on("peer:nego:needed", ({ to, offer }) => {
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    })
    socket.on("peer:nego:done", ({ to, ans }) => {
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    })
    socket.on("call:ended", ({ to }) => {
        // Broadcast to the recipient that the call has ended
        io.to(to).emit("call:ended");
    });

    // Disconnect event handling
    socket.on("disconnect", () => {
        console.log("Socket disconnected", socket.id);
        // Clean up any resources associated with the socket
        const email = socketIdtoEmailMap.get(socket.id);
        if (email) {
            emailToSocketIdMap.delete(email);
            socketIdtoEmailMap.delete(socket.id);
        }
    });
})