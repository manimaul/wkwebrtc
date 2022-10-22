package com.willkamp

import com.willkamp.models.*
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.channels.ClosedReceiveChannelException
import kotlinx.coroutines.channels.SendChannel
import java.time.Duration
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

val rooms = ConcurrentHashMap<String, Room>()

class Room(
    val users: MutableList<User> = mutableListOf()
) {
    suspend fun send(data: WsTxData) {
        users.forEach { it.send(data) }
    }
}

class User(
    val id: String = UUID.randomUUID().toString(),
    private val outgoing: SendChannel<Frame>
) {

    var roomId: String? = null

    suspend fun send(data: WsTxData) {
        outgoing.send(data.toMessageFrame())
    }

    fun room() : Room? {
        return roomId?.let { rooms[it] }
    }
}

suspend fun User.handle(data: RoomJoin) {
    val room = rooms.computeIfAbsent(data.roomId) { Room() }
    when (room.users.size) {
        0 -> {
            logger.info("creating room ${data.roomId} and emitting RoomCreated socket event")
            room.users.add(this)
            send(RoomCreated(data.roomId))
            roomId = data.roomId
        }
        1 -> {
            logger.info("Joining room ${data.roomId} and emitting RoomJoined socket event")
            room.users.add(this)
            send(RoomJoined(data.roomId))
            roomId = data.roomId
        }
        else -> {
            logger.info("Can't join room ${data.roomId}, emitting FullRoom socket event")
            send(FullRoom(data.roomId))
        }
    }
}

suspend fun User.handle(data: StartCall) {
    logger.info("Broadcasting StartCall event to peers in room $roomId")
    room()?.send(data)
}

suspend fun User.handle(data: WebRtcOffer) {
    logger.info("Broadcasting WebRtcOffer event = $data to peers in room <${data.roomId}>")
    room()?.send(data)
}

suspend fun User.handle(data: WebRtcAnswer) {
    logger.info("Broadcasting WebRtcAnswer = $data event to peers in room <${data.roomId}>")
    room()?.send(data)
}

suspend fun User.handle(data: WebRtcIceCandidate) {
    logger.info("Broadcasting WebRtcIceCandidate event = $data to peers in room <${data.roomId}>")
    room()?.send(data)
}

fun Application.configureSockets() {
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(15)
        timeout = Duration.ofSeconds(15)
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }

    routing {
        webSocket("/rtc") {
            val user = User(outgoing = outgoing)
            logger.info("ws connected")
            user.send(SocketOpen("hi"))
            logger.info("ws said hi")
            try {
                for (frame in incoming) {
                    logger.info("ws incoming frame")
                    when (val data = frame.wsRxData()) {
                        is RoomJoin -> user.handle(data)
                        is StartCall -> user.handle(data)
                        is WebRtcAnswer -> user.handle(data)
                        is WebRtcIceCandidate -> user.handle(data)
                        is WebRtcOffer -> user.handle(data)
                        null -> {
                            logger.info("unknown frame ${(frame as? Frame.Text)?.readText()}")
                        }
                    }
                }
            } catch (e: ClosedReceiveChannelException) {
                logger.info("onClose ${closeReason.await()}")
            } catch (e: Throwable) {
                logger.error("onError ${closeReason.await()}", e)
            }

            user.roomId?.let {
                logger.info("removing user = ${user.id} from room = ${user.roomId}")
                rooms[it]?.users?.remove(user)
            }
            logger.info("ws end ---------------")
        }
    }
}

fun Frame.wsRxData() : WsRxData? {
    return if (this is Frame.Text) {
        readText().wsData() as? WsRxData
    } else {
        null
    }
}


