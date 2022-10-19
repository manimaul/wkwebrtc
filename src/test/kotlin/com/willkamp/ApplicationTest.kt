package com.willkamp

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class ApplicationTest {
    @Test
    fun testRoot() = testApplication {
        application {
            configureJson()
            configureRouting()
        }
        client.get("/turn").apply {
            assertEquals(HttpStatusCode.OK, status)
        }
    }
}