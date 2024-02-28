import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const LobbyScreen = () => {
    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");
    const navigate = useNavigate();
    const socket = useSocket();

    const handleSubmit = useCallback(
        (e) => {
            e.preventDefault();
            socket.emit("room:join", { email, room });
        },
        [email, room, socket]
    );

    const handleJoinRoom = useCallback(
        (data) => {
            const { email, room } = data;
            navigate(`/room/${room}`);
        },
        [navigate]
    );

    useEffect(() => {
        socket.on("room:join", handleJoinRoom);
        return () => socket.off("room:join", handleJoinRoom);
    }, [socket, handleJoinRoom]);

    return (
        <>
            <div className="min-h-screen w-[100%] flex items-center justify-center text-white relative">
                <img
                    src="/wallpaper.jpg"
                    alt=""
                    className="absolute h-screen w-screen object-cover"
                />
                <div className="flex flex-col justify-center items-center bg-gray-400 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10 border border-gray-100">
                    <h1 className="text-center text-4xl mt-4 mb-5">Lobby</h1>
                    <form action="" onSubmit={handleSubmit}>
                        <div className="flex md:flex-col justify-evenly text-3xl w-full flex-col p-4">
                            <div className="flex flex-col items-start  text-xl">
                                <label className="mb-2" htmlFor="email">
                                    Name
                                </label>
                                <input
                                    placeholder="Your Name"
                                    className="border-2 rounded-md mb-2 p-2 w-64 text-sm text-black"
                                    type="text"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col items-start text-xl ">
                                <label className="mb-2" htmlFor="room">
                                    Room No
                                </label>
                                <input
                                    placeholder="Enter Room No"
                                    className="border-2 rounded-md mb-2 p-2 w-64 text-sm text-black"
                                    type="text"
                                    id="room"
                                    value={room}
                                    onChange={(e) => setRoom(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                className="border-2 mt-3 mb-4 text-2xl py-3 px-6  rounded-md font-bold"
                                style={{ backgroundColor: "#2e253a" }}
                            >
                                Join
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default LobbyScreen;
