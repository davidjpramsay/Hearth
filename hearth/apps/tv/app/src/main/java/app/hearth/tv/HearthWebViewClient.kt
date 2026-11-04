package app.hearth.tv

import android.net.http.SslError
import android.os.Build
import android.webkit.RenderProcessGoneDetail
import android.webkit.SafeBrowsingResponse
import android.webkit.SslErrorHandler
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.annotation.RequiresApi
import java.io.ByteArrayInputStream

class HearthWebViewClient(
    private val trustedOrigin: String,
    private val fallbackViewportScript: String? = null,
    private val onReady: (String) -> Unit,
    private val onUnavailable: (String?, Boolean) -> Unit,
) : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
        !TrustedOrigin.matches(trustedOrigin, request.url.toString())

    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest,
    ): WebResourceResponse? {
        val scheme = request.url.scheme?.lowercase()
        if (scheme != "http" && scheme != "https") return blockedResponse()
        return if (TrustedOrigin.matches(trustedOrigin, request.url.toString())) null else blockedResponse()
    }

    override fun onPageCommitVisible(view: WebView, url: String) {
        showReady(view, url)
    }

    override fun doUpdateVisitedHistory(view: WebView, url: String, isReload: Boolean) {
        showReady(view, url)
    }

    override fun onPageFinished(view: WebView, url: String) {
        // Older WebViews get a final post-parser pass, without weakening origin/CSP checks.
        if (fallbackViewportScript != null) showReady(view, url)
    }

    private fun showReady(view: WebView, url: String) {
        if (!TrustedOrigin.matches(trustedOrigin, url)) return
        val script = fallbackViewportScript
        if (script == null) onReady(url)
        else view.evaluateJavascript(script) { onReady(url) }
    }

    override fun onReceivedError(
        view: WebView,
        request: WebResourceRequest,
        error: WebResourceError,
    ) {
        if (request.isForMainFrame) onUnavailable(
            error.description?.toString(),
            error.errorCode in setOf(ERROR_HOST_LOOKUP, ERROR_CONNECT, ERROR_TIMEOUT, ERROR_IO),
        )
    }

    override fun onReceivedHttpError(
        view: WebView,
        request: WebResourceRequest,
        errorResponse: WebResourceResponse,
    ) {
        if (request.isForMainFrame && errorResponse.statusCode >= 400) {
            onUnavailable("Hearth returned ${errorResponse.statusCode}.", retryableHttpStatus(errorResponse.statusCode))
        }
    }

    override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
        handler.cancel()
        onUnavailable("Hearth could not verify the private server certificate.", false)
    }

    @RequiresApi(Build.VERSION_CODES.O_MR1)
    override fun onSafeBrowsingHit(
        view: WebView,
        request: WebResourceRequest,
        threatType: Int,
        callback: SafeBrowsingResponse,
    ) {
        callback.backToSafety(true)
        onUnavailable("Android blocked unsafe web content.", false)
    }

    override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
        onUnavailable("Android System WebView stopped unexpectedly.", false)
        return true
    }

    private fun blockedResponse(): WebResourceResponse = WebResourceResponse(
        "text/plain",
        "UTF-8",
        403,
        "Blocked by Hearth",
        emptyMap(),
        ByteArrayInputStream("Blocked by Hearth".toByteArray()),
    )
}
