package com.willkamp.models

import kotlinx.serialization.Serializable
import java.util.*

@Serializable
data class TurnServer(
    val url: String = "turn:turn.willkamp.com:19403",
    val userName: String = UUID.randomUUID().toString(),
    val credentials: String = "todo"
)
