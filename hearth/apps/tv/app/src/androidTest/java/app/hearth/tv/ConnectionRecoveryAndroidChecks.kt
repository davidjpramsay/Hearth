package app.hearth.tv

import android.app.Instrumentation
import android.content.Intent
import android.view.View
import android.view.KeyEvent
import android.graphics.Bitmap
import java.io.File
import android.view.ViewGroup
import android.widget.TextView
import android.webkit.WebView
import java.net.ServerSocket
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicBoolean

/** Isolated loopback server and fictional credential; never contacts a household server. */
internal class ConnectionRecoveryAndroidChecks(private val instrumentation: Instrumentation) {
    fun run(mode: String) {
        val server = ServerSocket(0)
        val validations = AtomicInteger()
        val pages = AtomicInteger()
        val restored = AtomicBoolean(false)
        val thread = Thread {
            while (!server.isClosed) {
                val socket = runCatching { server.accept() }.getOrNull() ?: break
                socket.use {
                    val reader = it.getInputStream().bufferedReader()
                    val request = reader.readLine().orEmpty()
                    while (!reader.readLine().isNullOrEmpty()) { /* consume headers only */ }
                    val validation = request.contains("/api/v1/device-sessions/current")
                    val count = if (validation) validations.incrementAndGet() else pages.incrementAndGet()
                    val status = when {
                        validation && mode == "denied" -> 401
                        validation && mode in listOf("persistent", "back") && !restored.get() -> 503
                        validation && (mode == "validation" || mode == "pause") && count == 1 -> 503
                        !validation && mode == "page" && count == 1 -> 503
                        else -> 200
                    }
                    val body = when {
                        status != 200 -> """{"error":{"message":"Fixture unavailable"}}"""
                        validation -> """{"deviceId":"fixture_screen","householdId":"fixture_home","deviceName":"Fixture TV"}"""
                        else -> "<html><body><button>Recovery fixture ready</button></body></html>"
                    }
                    val bytes = body.toByteArray()
                    val type = if (validation) "application/json" else "text/html"
                    val header = "HTTP/1.1 $status Fixture\r\nContent-Type: $type\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n"
                    runCatching { it.getOutputStream().apply { write(header.toByteArray()); write(bytes); flush() } }
                }
            }
        }.apply { isDaemon = true; start() }
        val context = instrumentation.targetContext
        val store = CredentialStore(context)
        val credential = TvCredential("http://127.0.0.1:${server.localPort}", "fixture_screen", "fixture_home", "fixture-only-not-a-household-secret")
        store.save(credential)
        val activity = instrumentation.startActivitySync(Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        fun visibleText(expected: String): Boolean {
            var found = false
            instrumentation.runOnMainSync {
                fun visit(view: View) {
                    if (view is TextView && view.isShown && view.text.toString().contains(expected)) found = true
                    if (view is ViewGroup) for (i in 0 until view.childCount) visit(view.getChildAt(i))
                }
                visit(activity.window.decorView)
            }
            return found
        }
        fun ready(): Boolean {
            var found = false
            var covered = false
            instrumentation.runOnMainSync {
                fun visit(view: View) {
                    if (view is RecoveryView && view.isShown) covered = true
                    if (view is WebView && view.isShown) found = true
                    if (view is ViewGroup) for (i in 0 until view.childCount) visit(view.getChildAt(i))
                }
                visit(activity.window.decorView)
            }
            return found && !covered
        }
        fun awaitCondition(condition: () -> Boolean) {
            val deadline = System.currentTimeMillis() + 35_000
            while (!condition() && System.currentTimeMillis() < deadline) Thread.sleep(100)
            check(condition()) { "Recovery fixture $mode did not reach its expected state" }
        }
        fun screenshot(label: String) {
            instrumentation.uiAutomation.takeScreenshot()?.let { bitmap ->
                File(context.getExternalFilesDir(null), "recovery-$label.png").outputStream().use {
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
                }
                bitmap.recycle()
            }
        }
        fun focusedText(): String {
            var value = ""
            instrumentation.runOnMainSync { value = (activity.currentFocus as? TextView)?.text?.toString().orEmpty() }
            return value
        }
        try {
            if (mode == "persistent") {
                awaitCondition { visibleText("Connecting to Hearth") }
                screenshot("connecting")
            }
            if (mode == "pause") {
                awaitCondition { validations.get() == 1 }
                instrumentation.runOnMainSync { instrumentation.callActivityOnPause(activity) }
                val pausedCount = validations.get()
                Thread.sleep(3_000)
                check(validations.get() == pausedCount) { "Retried while paused" }
                instrumentation.runOnMainSync { instrumentation.callActivityOnResume(activity) }
            }
            when (mode) {
                "back" -> {
                    awaitCondition { validations.get() == 1 }
                    instrumentation.sendKeyDownUpSync(KeyEvent.KEYCODE_BACK)
                    awaitCondition { activity.isFinishing }
                    val count = validations.get()
                    Thread.sleep(3_000)
                    check(validations.get() == count) { "Retried after Back" }
                    check(store.load() == credential)
                }
                "denied" -> {
                    awaitCondition { visibleText("This television was disconnected") }
                    Thread.sleep(2_500)
                    check(validations.get() == 1)
                    check(store.load() == null)
                }
                "persistent" -> {
                    awaitCondition { visibleText("Hearth is out of reach") }
                    val finalCount = validations.get()
                    Thread.sleep(2_500)
                    check(validations.get() == finalCount && finalCount <= 5)
                    check(store.load() == credential)
                    awaitCondition { focusedText() == "Try again" }
                    screenshot("offline")
                    instrumentation.sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_RIGHT)
                    awaitCondition { focusedText() == "Change address" }
                    instrumentation.sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_LEFT)
                    awaitCondition { focusedText() == "Try again" }
                    restored.set(true)
                    instrumentation.sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_CENTER)
                    awaitCondition { ready() }
                    check(validations.get() == finalCount + 1)
                }
                else -> {
                    awaitCondition { ready() }
                    check(validations.get() >= 2) { "Ready too soon: validations=${validations.get()}, pages=${pages.get()}" }
                    if (mode == "page") check(pages.get() >= 2)
                    check(store.load() == credential)
                }
            }
        } catch (failure: Throwable) {
            screenshot("$mode-failure")
            throw failure
        } finally {
            instrumentation.runOnMainSync { activity.finish() }
            server.close()
            thread.join(1_000)
            store.clear()
        }
    }
}
