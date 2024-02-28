import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer.js";
import { useNavigate } from "react-router-dom";

const RoomPage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [participant, setParticipant] = useState("");

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email joined ${email} `);
    setParticipant(email);
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
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeedIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncoming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncoming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    handleUserJoined,
    socket,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeeded,
    handleNegoNeedFinal,
  ]);

  const handleEndCall = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    socket.emit("call:ended", { to: remoteSocketId });
    setIsCallActive(false);
    setRemoteSocketId(null);
    navigate("/");
  }, [myStream, remoteStream, remoteSocketId, socket]);

  const handleCallButton = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setIsCallActive(true);
    setMyStream(stream);
  }, [remoteSocketId, socket]);
  return (
    <>
      <div
        className=" flex flex-col text-white items-center justify-center space-y-5 md:space-y-8 px-4 min-h-screen w-[100%]"
        style={{ backgroundColor: "#0d4381" }}
      >
        <h1 className="text-4xl mt-5 absolute top-0 left-10 text-center p-4">
          ⛺ Room Page
        </h1>
        <div className=" flex w-[50%]  flex-col md:flex-row items-center justify-center text-center space-y-3 md:space-y-0 md:space-x-3">
          {!isCallActive && (
            <h1>{remoteSocketId ? "Connected" : "No one is in the room"}</h1>
          )}
          {
            myStream &&
            <button
              className="ml-2 md:ml-0 md:mt-0 p-2 rounded-xl hover:shadow-md"
              style={{ backgroundColor: "#2e253a" }}
              onClick={sendStreams}
            >
              Send Stream
            </button>
          }
        </div>
        {!myStream && (
          <div className="text-center flex md:flex-row flex-col gap-4 items-center">
            {
              remoteSocketId && <button
                onClick={handleCallButton}
                className="w-full md:w-auto py-2 px-4 bg-green-700 rounded-3xl hover:shadow-md hover:shadow-green-400"
              >
                CALL
              </button>
            }
            <h1>Participants</h1>
            <p>{participant}</p>
          </div>
        )}
        {myStream && (
          <div className="text-center bg-red-700 rounded-3xl hover:shadow-md hover:shadow-red-400 font-bold">
            <button
              onClick={handleEndCall}
              className="w-full md:w-auto py-2 px-4"
            >
              DISCONNECT
            </button>
          </div>
        )}

        <div className="w-full md:flex">
          {remoteStream && (
            <div className="w-full md:w-[50%] mx-auto text-center">
              <h1>Remote Stream</h1>
              <div className="relative" style={{ paddingTop: "56.25%" }}>
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
          {myStream && (
            <div className="w-full md:w-[50%] mx-auto text-center">
              <h1>My Stream</h1>
              <div className="relative" style={{ paddingTop: "56.25%" }}>
                <ReactPlayer
                  className="absolute top-0 left-0"
                  playing
                  url={myStream}
                  width="100%"
                  height="100%"
                  muted
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RoomPage;