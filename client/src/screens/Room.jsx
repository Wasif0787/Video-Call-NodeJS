import React, { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import ReactPlayer from 'react-player';
import peer from "../service/peer.js"

const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email joined ${email} `);
        setRemoteSocketId(id);
    }, []);

    const handleIncommingCall = useCallback(
        async ({ from, offer }) => {
            setRemoteSocketId(from);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setMyStream(stream);
            console.log(`Incoming Call`, from, offer);
            const ans = await peer.getAnswer(offer);
            socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
    );

    useEffect(() => {
        peer.peer.addEventListener("track", async ev => {
            const remoteStream = ev.streams
            setRemoteStream(remoteStream[0])
        })
    }, [])

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer()
        socket.emit('peer:nego:needed', { offer, to: remoteSocketId })
    }, [remoteSocketId, socket])

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded)
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded)
        }
    }, [handleNegoNeeded])

    const sendStreams = useCallback(() => {
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream)
        }
    }, [myStream])

    const handleCallAccepted = useCallback(
        ({ from, ans }) => {
            peer.setLocalDescription(ans);
            console.log("Call Accepted!");
            sendStreams()
        },
        [sendStreams]
    );

    const handleNegoNeedIncoming = useCallback(async ({ from, offer }) => {
        const ans = await peer.getAnswer(offer)
        socket.emit("peer:nego:done", { to: from, ans })
    }, [socket])

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans)
    }, [])

    useEffect(() => {
        socket.on('user:joined', handleUserJoined);
        socket.on("incoming:call", handleIncommingCall)
        socket.on("call:accepted", handleCallAccepted)
        socket.on("peer:nego:needed", handleNegoNeedIncoming)
        socket.on("peer:nego:final", handleNegoNeedFinal)
        return () => {
            socket.off('user:joined', handleUserJoined);
            socket.off('incoming:call', handleIncommingCall);
            socket.off("call:accepted", handleCallAccepted)
            socket.off("peer:nego:needed", handleNegoNeedIncoming)
            socket.off("peer:nego:final", handleNegoNeedFinal)
        };
    }, [handleUserJoined, socket, handleIncommingCall, handleCallAccepted, handleNegoNeeded, handleNegoNeedFinal]);



    const handleCallButton = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const offer = await peer.getOffer()
        socket.emit("user:call", { to: remoteSocketId, offer })
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    return (
        <div className="flex flex-col items-center justify-center space-y-5 md:space-y-8 px-4">
            <h1 className="text-4xl mt-5">Room Page</h1>
            <h4>{remoteSocketId ? 'Connected' : 'No one is in the room'}</h4>
            {myStream && <button onClick={sendStreams}>Send Stream</button>}
            <div className="text-center">
                {remoteSocketId && (
                    <button onClick={handleCallButton} className="border-4 w-full md:w-auto py-2 px-4">
                        CALL
                    </button>
                )}
            </div>
            <div className='w-full flex '>
                {myStream && (
                    <div className="w-full md:w-[50%] mx-auto text-center">
                        <h1>My Stream</h1>
                        <div className="relative" style={{ paddingTop: '56.25%' }}>
                            <ReactPlayer
                                className="absolute top-0 left-0"
                                playing
                                url={myStream}
                                width="100%"
                                height="100%"
                            />
                        </div>
                    </div>
                )}
                {remoteStream && (
                    <div className="w-full md:w-[50%] mx-auto text-center">
                        <h1>Remote Stream</h1>
                        <div className="relative" style={{ paddingTop: '56.25%' }}>
                            <ReactPlayer
                                className="absolute top-0 left-0"
                                playing
                                url={remoteStream}
                                width="100%"
                                height="100%"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomPage;
