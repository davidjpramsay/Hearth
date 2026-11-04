package app.hearth.tv

import java.io.IOException
import javax.net.ssl.SSLException

/** Main-thread, read-only reconnect window. Tokens reject late callbacks after pause/retry. */
internal class ConnectionRecovery(
    private val schedule: (Long, () -> Unit) -> (() -> Unit),
    private val attempt: (Long) -> Unit,
    private val exhausted: (String?) -> Unit,
) {
    private var serial = 0L
    private var token = 0L
    private var attempts = 0
    private var waiting = false
    private var cancelDelay: (() -> Unit)? = null
    private var cancelDeadline: (() -> Unit)? = null
    private var message: String? = null
    var running = false
        private set

    fun start() {
        cancel()
        running = true
        attempts = 0
        message = null
        val window = serial
        cancelDeadline = schedule(30_000) {
            if (running && serial == window) finish()
        }
        nextAttempt()
    }

    fun accepts(value: Long) = running && !waiting && token == value

    fun failed(value: Long, retryable: Boolean, reason: String?) {
        if (!accepts(value)) return
        message = reason
        if (!retryable || attempts >= 5) {
            finish()
            return
        }
        waiting = true
        val window = serial
        cancelDelay = schedule(listOf(2_000L, 4_000L, 6_000L, 8_000L)[attempts - 1]) {
            if (running && serial == window) nextAttempt()
        }
    }

    fun succeeded(value: Long) {
        if (accepts(value)) cancel()
    }

    fun cancel() {
        serial += 1
        running = false
        waiting = false
        cancelDelay?.invoke()
        cancelDeadline?.invoke()
        cancelDelay = null
        cancelDeadline = null
    }

    private fun nextAttempt() {
        waiting = false
        attempts += 1
        token += 1
        attempt(token)
    }

    private fun finish() {
        val reason = message
        cancel()
        exhausted(reason)
    }
}

internal fun retryableHttpStatus(status: Int): Boolean = status in setOf(408, 429, 500, 502, 503, 504)

internal fun retryableConnectionFailure(error: Throwable): Boolean = when (error) {
    is SSLException -> false
    is PairingClientException -> retryableHttpStatus(error.statusCode)
    is IOException -> true
    else -> false
}
