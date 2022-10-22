import './RoomSelect.css';
import React, {useState} from 'react';
import {useNavigate} from "react-router-dom";

function RoomSelect() {

    const [inputRoom, setInputRoom] = useState('');
    const navigate = useNavigate();

    function selectRoom() {
        console.log(`input room = ${inputRoom}`)
        if (inputRoom !== "") {
            navigate(`room/${inputRoom}`);
        }
    }

    function selectInputRoom(e) {
        console.log(`select input room = ${e.target.value}`)
        setInputRoom(e.target.value)
    }

    const inputLabel = "Enter the conference room name"

    return (
        <div className="centered">
            <h1 className="display-4">WebRTC Video Conference</h1>
            <div className="input-group mb-3">
                <input type="text" className="form-control" placeholder={inputLabel}
                       aria-label={inputLabel} aria-describedby="join-button" onChange={selectInputRoom}/>
                <button className="btn btn-outline-success" type="button" id="join-button" onClick={selectRoom}>Join</button>
            </div>
        </div>
    );
}


export default RoomSelect;
