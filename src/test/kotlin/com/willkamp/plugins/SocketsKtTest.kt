package com.willkamp.plugins

import com.willkamp.models.FullRoom
import com.willkamp.models.SocketOpen
import com.willkamp.models.WsTxData
import com.willkamp.models.wsData
import io.ktor.websocket.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlin.test.*

class SocketsKtTest {

    @Test
    fun socketOpen() {
        val data = """{
                "name": "SocketOpen",
                "data": {"message": "hi"}
            }""".wsData()

        assertNotNull(data)
        assertTrue(data is SocketOpen)
        assertEquals("hi", data.message)
    }

    @Test
    fun fullRoom() {
        val data = """{
                "name": "FullRoom",
                "data": {"roomId": "aa"}
            }""".wsData()

        assertNotNull(data)
        assertTrue(data is FullRoom)

        val frame = data.toMessageFrame()
        assertEquals("""{"name":"FullRoom","data":{"type":"com.willkamp.models.FullRoom","roomId":"aa"}}""", frame.readText())
    }


    @Test
    fun socketOpenInvalid() {
        val data = """{
                "name": "SocketOpen",
                "data": {"foo": "bar"}
            }""".wsData()
        assertNull(data)
    }
}
