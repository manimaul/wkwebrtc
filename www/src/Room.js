import React, {useEffect, useRef} from 'react';
import { useParams } from "react-router-dom";
import {videoConnect, videoDisconnect} from "./WebRtc";
import { Link } from "react-router-dom";

const mediaConstraints = {
    audio: true,
    video: {width: 1280, height: 720},
    constraints: {
        facingMode: {
            exact: 'environment'
        }
    }
}

export default function Room() {
    const remoteVideo = useRef(null);
    const localVideo = useRef(null);
    let params = useParams();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(stream => {
                localVideo.current.srcObject = stream
                videoConnect(remoteVideo.current, stream, params.roomId)
            })
            .catch(console.log)

        return () => {
            videoDisconnect()
        }
    });

    return (
        <div className="container">
            <h1 className="display-4">Room - {params.roomId}</h1>
            <Link to="/"><button>Leave</button></Link>
            <hr/>
            <div className="container">
                <div className="row">
                    <div className="col">
                        <p>You</p>
                        <video className="w-100 h-auto border border-3 border-primary" autoPlay="autoplay" muted="muted" ref={localVideo}/>
                    </div>
                    <div className="col">
                        <p>Guest</p>
                        <video className="w-100 h-auto" autoPlay="autoplay" ref={remoteVideo}></video>
                    </div>
                </div>
            </div>
        </div>
    );
}
