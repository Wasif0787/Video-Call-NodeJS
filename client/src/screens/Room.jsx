import React, { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import ReactPlayer from 'react-player';
import peer from "../service/peer.js"
import { useNavigate } from "react-router-dom"

const RoomPage = () => {
    const socket = useSocket();
    const navigate = useNavigate()
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [participant, setParticipant] = useState("")

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email joined ${email} `);
        setParticipant(email)
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

    const handleEndCall = useCallback(() => {
        if (myStream) {
            myStream.getTracks().forEach(track => track.stop());
            setMyStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }
        socket.emit('call:ended', { to: remoteSocketId });
        setIsCallActive(false);
        setRemoteSocketId(null);
        navigate("/")
    }, [myStream, remoteStream, remoteSocketId, socket]);

    const handleCallButton = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const offer = await peer.getOffer()
        socket.emit("user:call", { to: remoteSocketId, offer })
        setIsCallActive(true);
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    return (
        <div className='min-h-screen w-[100%] bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200'>
            <h1 className='text-4xl text-center'>Room Page</h1>
            <div className='text-center'>
                {!remoteSocketId && <h4>No one in the room</h4>}
                {myStream && <button onClick={sendStreams}>Send Stream</button>}
            </div>
            {!myStream && (
                <div className='mx-2'>
                    {remoteSocketId && <div className=''>
                        <div className=''>
                            <h1 className='mt-5 mb-2 text-lg text-gray-900 font-bold'>Participant</h1>
                            <div className="border rounded-lg p-3 flex items-center justify-between">
                                <span className="mr-2 text-slate-800 md:text-4xl">{participant}</span>
                                <button className='p-1' onClick={handleCallButton}>
                                    <img src="../../public/video-call.png" alt="Video Call" className="w-5 md:w-8" />
                                </button>
                            </div>
                        </div>
                    </div>
                    }
                </div>
            )}

            <div className='flex md:flex-row flex-col w-full items-center justify-center gap-3'>
                {remoteStream && (
                    <div>
                        <h1>Remote Stream</h1>
                        <div className=''>
                            <ReactPlayer
                                playing
                                url={remoteStream}
                                width="100%"
                                height="100%"
                            />
                        </div>
                    </div>
                )}
                {myStream && (
                    <div className=''>
                        <h1>My Stream</h1>
                        <div>
                            <ReactPlayer
                                playing
                                url={myStream}
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