package com.willkamp

import com.willkamp.models.IceServers
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
import java.io.File

fun Application.configureRouting() {
    val www = File(System.getenv("WWW"))
    logger.info("www path = ${www.absolutePath}")
    val index = File(www, "index.html")
    logger.info("index path = ${index.absolutePath}")
    routing {
        get("/ice") {
            call.respond(IceServers())
        }
        static {
            file("/", index)
            file("/room/*", index)
        }
        static("/") {
            files(www)
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
