package app.hearth.tv

import java.net.ConnectException
import javax.net.ssl.SSLHandshakeException
import org.junit.Assert.*
import org.junit.Test

class ConnectionRecoveryTest {
    private class Fixture {
        var now = 0L
        data class Task(val at: Long, val action: () -> Unit, var cancelled: Boolean = false)
        val tasks = mutableListOf<Task>()
        val attempts = mutableListOf<Long>()
        val failures = mutableListOf<String?>()
        val recovery = ConnectionRecovery(
            schedule = { delay, action ->
                val task = Task(now + delay, action)
                tasks.add(task)
                val cancel: () -> Unit = { task.cancelled = true }
                cancel
            },
            attempt = { attempts.add(it) },
            exhausted = { failures.add(it) },
        )
        fun advance(time: Long) {
            val end = now + time
            while (true) {
                val task = tasks.filter { !it.cancelled && it.at <= end }.minByOrNull { it.at } ?: break
                task.cancelled = true
                now = task.at
                task.action()
            }
            now = end
        }
    }

    @Test fun `a transient failure recovers without a manual press`() {
        val f = Fixture()
        f.recovery.start()
        f.recovery.failed(f.attempts.last(), true, null)
        f.advance(1_999)
        assertEquals(1, f.attempts.size)
        f.advance(1)
        assertEquals(2, f.attempts.size)
        f.recovery.succeeded(f.attempts.last())
        f.advance(60_000)
        assertTrue(f.failures.isEmpty())
        assertFalse(f.recovery.running)
    }

    @Test fun `a hung request or page reaches the hard deadline`() {
        val f = Fixture()
        f.recovery.start()
        f.advance(30_000)
        assertEquals(1, f.failures.size)
        assertFalse(f.recovery.accepts(f.attempts.last()))
    }

    @Test fun `repeated callbacks and permanent errors cannot loop`() {
        val f = Fixture()
        f.recovery.start()
        repeat(10) { f.recovery.failed(f.attempts.last(), true, null) }
        f.advance(2_000)
        assertEquals(2, f.attempts.size)
        f.recovery.failed(f.attempts.last(), false, "Certificate error")
        f.advance(60_000)
        assertEquals(listOf("Certificate error"), f.failures)
        assertEquals(2, f.attempts.size)
    }

    @Test fun `five attempts is the limit even for immediate failures`() {
        val f = Fixture()
        f.recovery.start()
        for (delay in listOf(2_000L, 4_000L, 6_000L, 8_000L)) {
            f.recovery.failed(f.attempts.last(), true, null)
            f.advance(delay)
        }
        f.recovery.failed(f.attempts.last(), true, "Unavailable")
        f.advance(60_000)
        assertEquals(5, f.attempts.size)
        assertEquals(listOf("Unavailable"), f.failures)
    }

    @Test fun `pause or Back cancels scheduled work and rejects late results`() {
        val f = Fixture()
        f.recovery.start()
        val old = f.attempts.last()
        f.recovery.failed(old, true, null)
        f.recovery.cancel()
        f.advance(60_000)
        assertEquals(1, f.attempts.size)
        assertTrue(f.failures.isEmpty())
        f.recovery.start()
        f.recovery.failed(old, false, "stale result")
        f.recovery.succeeded(old)
        assertTrue(f.recovery.running)
        f.recovery.succeeded(f.attempts.last())
        assertTrue(f.failures.isEmpty())
    }

    @Test fun `certificate auth and malformed responses are not transient`() {
        assertTrue(retryableConnectionFailure(ConnectException()))
        assertFalse(retryableConnectionFailure(SSLHandshakeException("fixture")))
        assertFalse(retryableConnectionFailure(IllegalArgumentException()))
        for (code in listOf(401, 403, 404, 400))
            assertFalse(retryableConnectionFailure(PairingClientException(code, "fixture")))
        for (code in listOf(408, 429, 500, 502, 503, 504))
            assertTrue(retryableConnectionFailure(PairingClientException(code, "fixture")))
    }
}
