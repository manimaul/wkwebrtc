package com.willkamp.models

import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.*
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlinx.serialization.Transient

/*
https://www.ietf.org/proceedings/87/slides/slides-87-behave-10.pdf

u=$((`date +%s` + 3600)):test
p=$(echo -n $u | openssl dgst -hmac $TURN_KEY -sha1 -binary | base64)
echo -e "username: $u\npassword: $p"
 */

fun credentials(ttl: Long, userName: String): String {
    val newUser = "$ttl:$userName"
    val key = System.getenv("TURN_KEY")
    return Base64.getEncoder().encodeToString(hmacSha1(newUser, key))
}

@Serializable
data class IceServers(
    val iceServers: List<TurnServer> = listOf(
        TurnServer(),
        TurnServer(
            urls = "stun:turn.willkamp.com:3478",
            username = null,
            credentials = null
        )
    )
)

@Serializable
data class TurnServer(
    @Transient
    val ttl: Long = Instant.now().epochSecond + 3600L * 6L, //6hrs
    val urls: String = "turn:turn.willkamp.com:3478",
    val username: String? = "$ttl:${UUID.randomUUID().toString().subSequence(0, 4)}",
    val credentials: String? = username?.let { credentials(ttl, username.split(':')[1]) }
)

private fun hmacSha1(value: String, key: String): ByteArray {
    val type = "HmacSHA1"
    val secret = SecretKeySpec(key.toByteArray(), type)
    val mac: Mac = Mac.getInstance(type)
    mac.init(secret)
    return mac.doFinal(value.toByteArray())
}
