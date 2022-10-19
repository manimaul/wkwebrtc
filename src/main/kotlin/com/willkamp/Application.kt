package com.willkamp

import com.willkamp.models.TurnServer
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.util.logging.*
import org.slf4j.event.Level

fun Application.configureRouting() {
    routing {
        get("/turn") {
            call.respond(TurnServer())
        }
        static {
            resource("/", "static/index.html")
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

lateinit var logger: Logger

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        install(CallLogging) {
            level = Level.INFO
        }
        logger = environment.log
        configureJson()
        configureRouting()
        configureSockets()
    }.start(wait = true)
}
