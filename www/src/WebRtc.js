var webSocket = null
var remoteStream = null
var isRoomCreator = null
var rtcPeerConnection = null
var rtcDataChannel = null
var roomId = null
var localStream = null
var remoteVideoComponent = null
var connected = false

function connect() {
    if (!connected && roomId != null && remoteVideoComponent != null && localStream != null && webSocket == null) {
        console.log("connecting")
        connected = true
        webSocket = createWebSocket()
    } else {
        console.log("skipping connect")
    }
}

function disconnect() {
    console.log("disconnecting")
    connected = false
    if (webSocket != null) {
        webSocket.close()
    }
    webSocket = null
    roomId = null
}

export function videoConnect(remoteVideoRef, localVideoStream, room) {
    console.log("setting remote video ref")
    remoteVideoComponent = remoteVideoRef
    localStream = localVideoStream
    roomId = room
    connect()
}
export function videoDisconnect() {
    if (localStream != null) {
        localStream.getTracks().forEach(track => track.stop())
    }
    remoteVideoComponent = null
    localStream = null
    disconnect()
}

const iceServers = async () => {
    const response = await fetch('/ice');
    return await response.json();
}

function addLocalTracks(rtcPeerConnection) {
    localStream.getTracks().forEach((track) => {
        rtcPeerConnection.addTrack(track, localStream)
    })
}

async function createOffer(rtcPeerConnection) {
    let sessionDescription
    try {
        sessionDescription = await rtcPeerConnection.createOffer()
        await rtcPeerConnection.setLocalDescription(sessionDescription)
    } catch (error) {
        console.error(error)
    }

    emit('WebRtcOffer', {
        sdp: b64enc(sessionDescription.sdp),
        "roomId": roomId,
    })
}

async function createAnswer(rtcPeerConnection) {
    let sessionDescription
    try {
        sessionDescription = await rtcPeerConnection.createAnswer()
        await rtcPeerConnection.setLocalDescription(sessionDescription)
    } catch (error) {
        console.error(error)
    }

    emit('WebRtcAnswer', {
        sdp: b64enc(sessionDescription.sdp),
        "roomId": roomId
    })
}

function setRemoteStream(event) {
    remoteVideoComponent.srcObject = event.streams[0]
    remoteStream = event.stream
}

function sendIceCandidate(event) {
    if (event.candidate) {
        emit('WebRtcIceCandidate', {
            "roomId": roomId,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        })
    }
}

function emit(name, data) {
    webSocket.send(JSON.stringify(
        {
            "name": name,
            "data": data
        }
    ))
}

function createWebSocket() {
    let baseUri = (window.location.protocol === 'https:' && 'wss://' || 'ws://') + window.location.host;
    let uri = `${baseUri}/rtc`
    let socket = new WebSocket(uri);
    socket.onclose = function () {
        console.log("websocket closed")
        setTimeout(function () {
            connect()
        }, 3000);
    };
    socket.onopen = function () {
        console.log(`websocket open - joining room ${roomId}`)
        socket.send(
            JSON.stringify({
                "name": "RoomJoin",
                "data": {"roomId": roomId}
            }))
    };
    socket.onmessage = async function (event) {
        let msg = JSON.parse(event.data)
        console.log(`handling event: ${msg.name}`)
        let fn = fnMap[msg.name]
        if (fn !== undefined) {
            await fn(msg.data)
        }
    };
    return socket;
}


let fnMap = {
    "SocketOpen": async function (data) {
        console.log(`Socket opened message = ${data.message}`)
    },
    "RoomCreated": async function () {
        console.log('Socket event callback: RoomCreated')
        isRoomCreator = true
    },
    "RoomJoined": async function () {
        console.log('Socket event callback: RoomJoined')
        emit('StartCall', {"roomId": roomId})
    },
    "FullRoom": async function () {
        console.log('Socket event callback: FullRoom')
        alert('The room is full, please try another one')
    },
    "StartCall": async function () {
        console.log('Socket event callback: StartCall')
        if (isRoomCreator) {
            let ice = await iceServers()
            rtcPeerConnection = new RTCPeerConnection(ice)
            rtcDataChannel = rtcPeerConnection.createDataChannel("chat", {
                ordered: true
            })
            await addLocalTracks(rtcPeerConnection)
            rtcPeerConnection.ontrack = setRemoteStream
            rtcPeerConnection.onicecandidate = sendIceCandidate
            await createOffer(rtcPeerConnection)
        }
    },
    "WebRtcOffer": async function (data) {
        console.log('Socket event callback: WebRtcOffer')
        if (!isRoomCreator) {
            let ice = await iceServers()
            rtcPeerConnection = new RTCPeerConnection(ice)
            rtcDataChannel = rtcPeerConnection.createDataChannel("chat", {
                ordered: true
            })
            await addLocalTracks(rtcPeerConnection)
            rtcPeerConnection.ontrack = setRemoteStream
            rtcPeerConnection.onicecandidate = sendIceCandidate
            let description = new RTCSessionDescription({
                "sdp": b64dec(data.sdp),
                "type": "offer" //RTCSdpType "answer" | "offer" | "pranswer" | "rollback"
            })
            await rtcPeerConnection.setRemoteDescription(description)
            await createAnswer(rtcPeerConnection)
        }
    },
    "WebRtcAnswer": async function (data) {
        console.log('Socket event callback: WebRtcAnswer')
        let description = new RTCSessionDescription({
            "sdp": b64dec(data.sdp),
            "type": "answer" //RTCSdpType "answer" | "offer" | "pranswer" | "rollback"
        })
        await rtcPeerConnection.setRemoteDescription(description)
    },
    "WebRtcIceCandidate": async function (data) {
        console.log('Socket event callback: WebRtcIceCandidate')
        let candidate = new RTCIceCandidate({
            sdpMLineIndex: data.label,
            candidate: data.candidate,
        })
        if (rtcPeerConnection != null) {
            await rtcPeerConnection.addIceCandidate(candidate)
        }
    }
};

function b64enc(str) {
    return btoa(encodeURIComponent(str));
}

function b64dec(str) {
    return decodeURIComponent(atob(str));
}
