package app.hearth.tv

import android.app.Activity
import android.app.Instrumentation
import android.os.Bundle
import java.util.regex.PatternSyntaxException

/** Runs against Android's ICU regex engine, not the desktop JVM used by unit tests. */
class BridgeProtocolInstrumentation : Instrumentation() {
    override fun onCreate(arguments: Bundle?) {
        super.onCreate(arguments)
        start()
    }

    override fun onStart() {
        val cases = listOf<Pair<String, () -> Unit>>(
            "androidRejectsTheFormerUnescapedBrace" to {
                val failure = runCatching {
                    Regex("^\\{\\s*\"type\"\\s*:\\s*\"([a-z.]+)\"\\s*}$")
                }.exceptionOrNull()
                check(failure is PatternSyntaxException) { "The Android regression fixture must reject the old pattern" }
            },
            "firstBridgeMessageInitializesWithoutCrashing" to {
                check(BridgeProtocol.parse("{\"type\":\"app.identity\"}") == NativeRequest.APP_IDENTITY)
            },
            "allFourAllowedMessagesAndJsonWhitespaceWork" to {
                for ((type, expected) in listOf(
                    "app.identity" to NativeRequest.APP_IDENTITY,
                    "network.status" to NativeRequest.NETWORK_STATUS,
                    "presentation.status" to NativeRequest.PRESENTATION_STATUS,
                    "exit.request" to NativeRequest.EXIT_REQUEST,
                )) {
                    check(BridgeProtocol.parse("{\"type\":\"$type\"}") == expected)
                    check(BridgeProtocol.parse("{ \n\t\"type\" : \"$type\"\r\n}") == expected)
                }
            },
            "malformedExtendedAndOversizedMessagesStayRejected" to {
                for (payload in listOf(
                    null,
                    "",
                    "x".repeat(257),
                    "{\"type\":\"intent.launch\"}",
                    "{\"type\":\"exit.request\",\"package\":\"other.app\"}",
                    "{\"type\":\"presentation.status\",\"active\":true}",
                    "{\"type\":\"presentation.status\",\"type\":\"exit.request\"}",
                    "{\"type\":\"app.identity\"} trailing",
                    "{\"type\":\"app.identity\"",
                    "\"type\":\"app.identity\"}",
                    "{\"type\":\"app.identity\"}}",
                    "[\"app.identity\"]",
                )) check(BridgeProtocol.parse(payload) == null) { "A non-protocol message was accepted" }
            },
        ) + listOf("validation", "page", "pause", "persistent", "denied", "back").map { mode ->
            "connectionRecovery_$mode" to { ConnectionRecoveryAndroidChecks(this).run(mode) }
        }
        for ((index, case) in cases.withIndex()) {
            val status = Bundle().apply {
                putString("class", BridgeProtocolInstrumentation::class.java.name)
                putString("test", case.first)
                putInt("numtests", cases.size)
                putInt("current", index + 1)
            }
            sendStatus(1, status)
            try {
                case.second()
                sendStatus(0, status)
            } catch (failure: Throwable) {
                status.putString("stack", failure.stackTraceToString())
                sendStatus(-2, status)
                finish(Activity.RESULT_CANCELED, Bundle().apply {
                    putString("stream", "FAIL: ${case.first}\n")
                })
                return
            }
        }
        finish(Activity.RESULT_OK, Bundle().apply {
            putString("stream", "OK (${cases.size} Android bridge/recovery tests)\n")
        })
    }
}
