package com.willkamp.models

import com.willkamp.logger
import io.ktor.websocket.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.encodeToJsonElement

@Serializable
sealed class WsTxData : WsData {

    fun toMessageFrame(): Frame.Text {
        val wsMsg = WsMsg(
            name = this.javaClass.simpleName,
            data = Json.encodeToJsonElement(this)
        )
        return Frame.Text(Json.encodeToString(wsMsg))
    }
}

@Serializable
private data class WsMsg(
    val name: String,
    val data: JsonElement? = null
) {
    fun wsData(): WsData? {
        return try {
            when (name) {
                "SocketOpen" -> decodeData<SocketOpen>()
                "RoomJoin" -> decodeData<RoomJoin>()
                "RoomCreated" -> decodeData<RoomCreated>()
                "RoomJoined" -> decodeData<RoomJoined>()
                "StartCall" -> decodeData<StartCall>()
                "WebRtcOffer" -> decodeData<WebRtcOffer>()
                "WebRtcAnswer" -> decodeData<WebRtcAnswer>()
                "FullRoom" -> decodeData<FullRoom>()
                "WebRtcIceCandidate" -> decodeData<WebRtcIceCandidate>()
                else -> null
            }
        } catch (e: Exception) {
            logger.error("error", e)
            null
        }
    }

    private inline fun <reified T> decodeData(): T? {
        return data?.let { Json.decodeFromJsonElement<T>(it) }
    }
}

fun String.wsData(): WsData? {
    return try {
        Json.decodeFromString<WsMsg>(this).wsData()
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

/*
const iceServers = {
    iceServers: [
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'stun:stun1.l.google.com:19302'},
        {urls: 'stun:stun2.l.google.com:19302'},
        {urls: 'stun:stun3.l.google.com:19302'},
        {urls: 'stun:stun4.l.google.com:19302'},
    ],
}
 */

// messages received from client
sealed interface WsData

sealed interface WsRxData : WsData

@Serializable
class RoomJoin(
    val roomId: String
) : WsRxData

// duplex messages sent to client and received from client

@Serializable
data class StartCall(
    val roomId: String,
) : WsRxData, WsTxData()

@Serializable
data class WebRtcOffer(
    val roomId: String,
    val sdp: String
) : WsRxData, WsTxData()

@Serializable
data class WebRtcAnswer(
    val roomId: String,
    val sdp: String,
) : WsRxData, WsTxData()

@Serializable
data class WebRtcIceCandidate(
    val roomId: String,
    val label: Int?,
    val candidate: String?
) : WsRxData, WsTxData()

// messages sent to client



@Serializable
data class SocketOpen(
    val message: String
) : WsTxData()

@Serializable
data class FullRoom(
    val roomId: String,
) : WsTxData()

@Serializable
data class RoomCreated(
    val roomId: String
) : WsTxData()

@Serializable
data class RoomJoined(
    val roomId: String
) : WsTxData()
