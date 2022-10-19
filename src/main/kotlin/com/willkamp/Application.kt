package com.willkamp

import io.ktor.server.engine.*
import io.ktor.server.netty.*
import com.willkamp.plugins.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.slf4j.event.Level
import java.util.*

fun Application.configureRouting() {
    routing {
        get("/turn") {
            call.respond(TurnServer())
        }
        static("/static") {
            resources("static")
        }
    }
}

fun Application.configureJson() {
    install(ContentNegotiation) {
        json()
    }
}

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        install(CallLogging) {
            level = Level.INFO
        }
        configureJson()
        configureRouting()
        configureSockets()
    }.start(wait = true)
}

@Serializable
data class TurnServer(
    val url: String = "turn:turn.willkamp.com:19403",
    val userName: String = UUID.randomUUID().toString(),
    val credentials: String = "todo"
)
