const roomSelectionContainer = document.getElementById('room-selection-container')
const roomInput = document.getElementById('room-input')
const connectButton = document.getElementById('connect-button')

const videoChatContainer = document.getElementById('video-chat-container')
const localVideoComponent = document.getElementById('local-video')
const remoteVideoComponent = document.getElementById('remote-video')

var webSocket = createWebSocket()

const mediaConstraints = {
    audio: true,
    video: {width: 1280, height: 720},
    constraints: {
        facingMode: {
            exact: 'environment'
        }
    },
}
let localStream
let remoteStream
let isRoomCreator
let rtcPeerConnection
let roomId

const iceServers = async () => {
    const response = await fetch('/ice');
    return await response.json();
}

connectButton.addEventListener('click', () => {
    joinRoom(roomInput.value)
})

function joinRoom(room) {
    if (room === '') {
        alert('Please type a room ID')
    } else {
        roomId = room
        emit('RoomJoin', {"roomId": roomId})
        showVideoConference()
    }
}

function showVideoConference() {
    roomSelectionContainer.style = 'display: none'
    videoChatContainer.style = 'display: block'
}

async function setLocalStream(mediaConstraints) {
    let stream
    try {
        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    } catch (error) {
        console.error('Could not get user media', error)
    }

    localStream = stream
    localVideoComponent.srcObject = stream
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
    let baseUri = (window.location.protocol == 'https:' && 'wss://' || 'ws://') + window.location.host;
    let uri = `${baseUri}/ws`
    let socket = new WebSocket(uri);
    socket.onclose = function (event) {
        setTimeout(function () {
            webSocket = createWebSocket()
        }, 3000);
    };
    socket.onopen = function (event) {
        console.log(`websocket open ${event.data}`)
        socket.send(
            JSON.stringify({
                "name": "SocketOpen",
                "data": {"message": "hi"}
            }))
    };
    socket.onmessage = async function (event) {
        console.log(`handling event: ${event.data}`)
        let msg = JSON.parse(event.data)
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
    "RoomCreated": async function (data) {
        console.log('Socket event callback: RoomCreated')

        await setLocalStream(mediaConstraints)
        isRoomCreator = true
    },
    "RoomJoined": async function (data) {
        console.log('Socket event callback: RoomJoined')

        await setLocalStream(mediaConstraints)
        emit('StartCall', {"roomId": roomId})
    },
    "FullRoom": async function (data) {
        console.log('Socket event callback: FullRoom')
        alert('The room is full, please try another one')
    },
    "StartCall": async function (data) {
        console.log('Socket event callback: StartCall')
        if (isRoomCreator) {
            let ice = await iceServers()
            rtcPeerConnection = new RTCPeerConnection(ice)
            addLocalTracks(rtcPeerConnection)
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
            addLocalTracks(rtcPeerConnection)
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
        await rtcPeerConnection.addIceCandidate(candidate)
    }
};

function b64enc(str) {
    return btoa(encodeURIComponent(str));
}

function b64dec(str) {
    return decodeURIComponent(atob(str));
}
