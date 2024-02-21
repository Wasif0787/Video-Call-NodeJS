import React, { useCallback, useState } from 'react';

const LobbyScreen = () => {
    const [email, setEmail] = useState("")
    const [room, setRoom] = useState("")
    const handleSubmit = useCallback((e) => {
        e.preventDefault()
        console.log({ email, room });
    }, [email, room])

    return (
        <div className='flex flex-col justify-center items-center'>
            <h1 className='text-center text-4xl mt-4 mb-5'>Lobby</h1>
            <form action="" onSubmit={handleSubmit}>
                <div className='flex md:flex-row justify-evenly text-3xl w-full flex-col'>
                    <div className='flex flex-col md:mr-8 text-xl'>
                        <label className='mb-2' htmlFor="email">Email</label>
                        <input className='border-2 rounded-md mb-2 p-2 w-64 text-sm' type="email" id='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className='flex flex-col text-xl md:ml-4'>
                        <label className='mb-2' htmlFor="room">Room No</label>
                        <input className='border-2 rounded-md mb-2 p-2 w-64 text-sm' type="text" id='room' value={room} onChange={(e) => setRoom(e.target.value)} />
                    </div>
                </div>
                <div className='flex justify-center'>
                    <button type='submit' className='border-2 mt-3 text-2xl py-3 px-6  rounded-md font-bold bg-slate-400'>Join</button>
                </div>
            </form>
        </div>
    );
};

export default LobbyScreen;
