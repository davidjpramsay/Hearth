package app.hearth.tv

import android.annotation.SuppressLint
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.RenderProcessGoneDetail
import android.webkit.SafeBrowsingResponse
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.annotation.RequiresApi
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import java.util.concurrent.Executors

class MainActivity : ComponentActivity() {
    private lateinit var root: FrameLayout
    private lateinit var recovery: RecoveryView
    private lateinit var credentialStore: CredentialStore
    private lateinit var localState: LocalStateStore
    private val pairingClient = PairingClient()
    private val networkExecutor = Executors.newSingleThreadExecutor()
    private val handler = Handler(Looper.getMainLooper())
    private var webView: WebView? = null
    private var nativeBridge: NativeBridge? = null
    @Volatile private var pairingGeneration = 0
    private var hasResumed = false
    private var foreground = false
    private var hasReadyWebContent = false
    private val presentationState = PresentationState()
    private var connectionToken = 0L
    private var recoverOnResume = false
    private var transientConnectionFailure = false
    private val connectionRecovery by lazy {
        ConnectionRecovery(
            schedule = { delay, action ->
                val task = Runnable { action() }
                handler.postDelayed(task, delay)
                val cancel: () -> Unit = { handler.removeCallbacks(task) }
                cancel
            },
            attempt = { token ->
                connectionToken = token
                val credential = credentialStore.load()
                if (credential == null) showServerEntry() else validateCredential(credential)
            },
            exhausted = { message ->
                val generation = ++pairingGeneration
                hideWebContent()
                recovery.showOffline(familyReachabilityMessage(message), ::bootstrap, ::changeAddress)
                // Error callbacks may still be on WebView's stack. Dispose after they return.
                handler.post { onMain(generation) { destroyWebView() } }
            },
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        credentialStore = CredentialStore(this)
        localState = LocalStateStore(this)
        root = FrameLayout(this)
        recovery = RecoveryView(this)
        root.addView(
            recovery,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            ),
        )
        setContentView(root)
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() = handleBack()
            },
        )
        enterTelevisionMode()
        bootstrap()
    }

    override fun onResume() {
        super.onResume()
        foreground = true
        publishPresentation(presentationState.update(
            resumed = true,
            windowFocused = hasWindowFocus(),
            contentReady = presentationContentReady(),
        ))
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        enterTelevisionMode()
        webView?.onResume()
        if (hasResumed) {
            if (recoverOnResume) {
                recoverOnResume = false
                bootstrap()
            } else revalidateOnResume()
        } else hasResumed = true
    }

    override fun onPause() {
        foreground = false
        recoverOnResume = connectionRecovery.running || transientConnectionFailure
        if (connectionRecovery.running) {
            connectionRecovery.cancel()
            pairingGeneration += 1
            destroyWebView()
        }
        publishPresentation(presentationState.update(resumed = false))
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        webView?.onPause()
        super.onPause()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        publishPresentation(presentationState.update(
            windowFocused = hasFocus,
            contentReady = presentationContentReady(),
        ))
    }

    override fun onDestroy() {
        connectionRecovery.cancel()
        publishPresentation(presentationState.update(resumed = false, contentReady = false))
        pairingGeneration += 1
        handler.removeCallbacksAndMessages(null)
        destroyWebView()
        networkExecutor.shutdownNow()
        super.onDestroy()
    }

    private fun bootstrap() {
        val credential = credentialStore.load()
        if (credential === null) {
            showServerEntry()
        } else {
            transientConnectionFailure = true
            connectionRecovery.start()
        }
    }

    private fun showServerEntry(error: String? = null) {
        connectionRecovery.cancel()
        transientConnectionFailure = false
        recoverOnResume = false
        hideWebContent()
        pairingGeneration += 1
        recovery.showServerEntry(
            initialOrigin = localState.serverOrigin ?: BuildConfig.DEFAULT_SERVER_ORIGIN,
            error = error,
            onConnect = ::beginPairing,
        )
    }

    private fun beginPairing(rawOrigin: String) {
        hideWebContent()
        val origin = runCatching { TrustedOrigin.normalize(rawOrigin, BuildConfig.DEBUG) }
            .getOrElse {
                showServerEntry(it.message)
                return
            }
        localState.serverOrigin = origin
        val generation = ++pairingGeneration
        recovery.showConnecting("Asking Hearth for a private pairing code…")
        networkExecutor.execute {
            runCatching { pairingClient.start(origin, BuildConfig.VERSION_NAME) }
                .onSuccess { session -> onMain(generation) { showPairing(origin, session, generation) } }
                .onFailure { error ->
                    onMain(generation) {
                        recovery.showOffline(
                            pairingErrorMessage(error),
                            { beginPairing(origin) },
                            ::changeAddress,
                        )
                    }
                }
        }
    }

    private fun showPairing(origin: String, session: PairingSession, generation: Int) {
        recovery.showPairing(
            code = session.code,
            onNewCode = { beginPairing(origin) },
            onChangeAddress = ::changeAddress,
        )
        handler.postDelayed({ pollPairing(origin, session, generation) }, pairingPollMillis)
    }

    private fun pollPairing(origin: String, session: PairingSession, generation: Int) {
        if (generation != pairingGeneration) return
        networkExecutor.execute {
            runCatching { pairingClient.status(origin, session.pairingId) }
                .onSuccess { status ->
                    onMain(generation) {
                        when (status) {
                            "approved" -> exchangePairing(origin, session, generation)
                            "pending" -> handler.postDelayed(
                                { pollPairing(origin, session, generation) },
                                pairingPollMillis,
                            )
                            else -> recovery.showOffline(
                                "That pairing code expired. Ask Hearth for a new one.",
                                { beginPairing(origin) },
                                ::changeAddress,
                            )
                        }
                    }
                }
                .onFailure { error ->
                    onMain(generation) {
                        recovery.showOffline(
                            pairingErrorMessage(error),
                            { pollPairing(origin, session, generation) },
                            ::changeAddress,
                        )
                    }
                }
        }
    }

    private fun exchangePairing(origin: String, session: PairingSession, generation: Int) {
        recovery.showConnecting("Finishing the private television connection…")
        networkExecutor.execute {
            runCatching { pairingClient.exchange(origin, session) }
                .onSuccess { device ->
                    val credential = TvCredential(
                        serverOrigin = origin,
                        deviceId = device.deviceId,
                        householdId = device.householdId,
                        pairingSecret = session.pairingSecret,
                    )
                    credentialStore.save(credential)
                    onMain(generation) { installCredentialAndLoad(credential) }
                }
                .onFailure { error ->
                    onMain(generation) {
                        recovery.showOffline(
                            pairingErrorMessage(error),
                            { pollPairing(origin, session, generation) },
                            ::changeAddress,
                        )
                    }
                }
        }
    }

    private fun validateCredential(credential: TvCredential) {
        destroyWebView()
        val generation = ++pairingGeneration
        recovery.showConnecting("Connecting to Hearth… Retrying automatically if your network is still waking up.")
        networkExecutor.execute {
            if (generation != pairingGeneration) return@execute
            runCatching {
                pairingClient.validate(credential.serverOrigin, credential.pairingSecret)
            }.onSuccess { session ->
                onMain(generation) {
                    if (
                        session.deviceId != credential.deviceId ||
                        session.householdId != credential.householdId
                    ) {
                        showRevoked()
                    } else {
                        installCredentialAndLoad(credential)
                    }
                }
            }.onFailure { error ->
                onMain(generation) {
                    if (error is PairingClientException && error.statusCode in setOf(401, 403)) {
                        showRevoked()
                    } else {
                        transientConnectionFailure = retryableConnectionFailure(error)
                        connectionRecovery.failed(connectionToken, transientConnectionFailure, pairingErrorMessage(error))
                    }
                }
            }
        }
    }

    private fun revalidateOnResume() {
        val credential = credentialStore.load() ?: return
        val generation = pairingGeneration
        networkExecutor.execute {
            runCatching {
                pairingClient.validate(credential.serverOrigin, credential.pairingSecret)
            }.onSuccess { session ->
                if (
                    session.deviceId != credential.deviceId ||
                    session.householdId != credential.householdId
                ) {
                    onMain(generation) { showRevoked() }
                }
            }.onFailure { error ->
                if (error is PairingClientException && error.statusCode in setOf(401, 403)) {
                    onMain(generation) { showRevoked() }
                }
            }
        }
    }

    private fun showRevoked() {
        connectionRecovery.cancel()
        transientConnectionFailure = false
        recoverOnResume = false
        pairingGeneration += 1
        credentialStore.clear()
        CookieManager.getInstance().removeAllCookies(null)
        destroyWebView()
        recovery.showRevoked { showServerEntry() }
    }

    private fun installCredentialAndLoad(credential: TvCredential) {
        val generation = pairingGeneration
        val secureAttribute = if (credential.serverOrigin.startsWith("https://")) "; Secure" else ""
        val cookie = "$deviceCookie=${credential.pairingSecret}; Path=/; HttpOnly; SameSite=Strict$secureAttribute"
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setCookie(credential.serverOrigin, cookie) { accepted ->
            onMain(generation) {
                if (!accepted) {
                    connectionRecovery.cancel()
                    transientConnectionFailure = false
                    recovery.showOffline(
                        "Android could not secure the television session.",
                        { installCredentialAndLoad(credential) },
                        ::changeAddress,
                    )
                    return@onMain
                }
                cookieManager.flush()
                createWebView(credential.serverOrigin)
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(origin: String) {
        destroyWebView()
        val view = WebView(this).apply {
            visibility = View.GONE
            setBackgroundColor(getColor(R.color.hearth_canvas))
            isFocusable = true
            isFocusableInTouchMode = true
            val metrics = resources.displayMetrics
            val initialScale = tvInitialScalePercent(
                widthPixels = metrics.widthPixels,
                heightPixels = metrics.heightPixels,
                density = metrics.density,
            )
            setInitialScale(initialScale)
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                javaScriptCanOpenWindowsAutomatically = false
                setSupportMultipleWindows(false)
                useWideViewPort = true
                loadWithOverviewMode = true
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                mediaPlaybackRequiresUserGesture = true
                userAgentString = "$userAgentString HearthTV/${BuildConfig.VERSION_NAME}"
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) safeBrowsingEnabled = true
            }
            val viewportScript = tvViewportScript(initialScale)
            val supportsDocumentStart = WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)
            if (supportsDocumentStart) {
                // Exact paired origin only; no credential or native capability is injected.
                WebViewCompat.addDocumentStartJavaScript(this, viewportScript, setOf(origin))
            }
            webChromeClient = WebChromeClient()
            webViewClient = presentationWebViewClient(
                this, origin, if (supportsDocumentStart) null else viewportScript,
            )
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        val bridge = NativeBridge(
            view, origin, ::networkAvailable, ::finishAfterTransition,
            presentationStatus = { presentationState.snapshot },
        )
        if (!bridge.install()) {
            view.destroy()
            connectionRecovery.cancel()
            transientConnectionFailure = false
            recovery.showWebViewUpdate()
            return
        }
        webView = view
        nativeBridge = bridge
        root.addView(
            view,
            0,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            ),
        )
        val path = localState.lastPath.takeIf { it.startsWith('/') } ?: "/today"
        view.loadUrl(origin + path)
    }

    private fun presentationWebViewClient(
        view: WebView,
        origin: String,
        fallbackViewportScript: String?,
    ): WebViewClient = object : WebViewClient() {
        private var committed = false
        private var unavailable = false
        private var documentGeneration = 0

        private fun delegate(): HearthWebViewClient {
            val generation = documentGeneration
            return HearthWebViewClient(
                trustedOrigin = origin,
                fallbackViewportScript = fallbackViewportScript,
                onReady = { url ->
                    if (
                        webView === view && generation == documentGeneration &&
                        committed && !unavailable && TrustedOrigin.matches(origin, url) &&
                        view.url?.let { TrustedOrigin.matches(origin, it) } == true
                    ) showWebContent(url)
                },
                onUnavailable = { message, retryable ->
                    if (webView === view && generation == documentGeneration && !unavailable) {
                        unavailable = true
                        showWebUnavailable(message, retryable)
                    }
                },
            )
        }

        override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
            documentGeneration += 1
            committed = false
            // Android may deliver HTTP failure before onPageStarted. Keep failure sticky;
            // recovery replaces this WebView, so an error document can never become ready.
            if (webView === view) {
                hasReadyWebContent = false
                publishPresentation(presentationState.update(contentReady = false))
            }
        }

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
            delegate().shouldOverrideUrlLoading(view, request)

        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
            delegate().shouldInterceptRequest(view, request)

        override fun onPageCommitVisible(view: WebView, url: String) {
            committed = true
            delegate().onPageCommitVisible(view, url)
        }

        override fun doUpdateVisitedHistory(view: WebView, url: String, isReload: Boolean) =
            delegate().doUpdateVisitedHistory(view, url, isReload)

        override fun onPageFinished(view: WebView, url: String) = delegate().onPageFinished(view, url)

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) =
            delegate().onReceivedError(view, request, error)

        override fun onReceivedHttpError(
            view: WebView, request: WebResourceRequest, errorResponse: WebResourceResponse,
        ) = delegate().onReceivedHttpError(view, request, errorResponse)

        override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) =
            delegate().onReceivedSslError(view, handler, error)

        @RequiresApi(Build.VERSION_CODES.O_MR1)
        override fun onSafeBrowsingHit(
            view: WebView, request: WebResourceRequest, threatType: Int, callback: SafeBrowsingResponse,
        ) = delegate().onSafeBrowsingHit(view, request, threatType, callback)

        @RequiresApi(Build.VERSION_CODES.O)
        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean =
            delegate().onRenderProcessGone(view, detail)
    }

    private fun showWebContent(url: String) {
        connectionRecovery.succeeded(connectionToken)
        transientConnectionFailure = false
        recoverOnResume = false
        val uri = Uri.parse(url)
        localState.lastPath = uri.encodedPath?.takeIf(String::isNotBlank) ?: "/today"
        recovery.visibility = View.GONE
        webView?.apply {
            visibility = View.VISIBLE
            requestFocus()
        }
        hasReadyWebContent = true
        publishPresentation(presentationState.update(contentReady = presentationContentReady()))
    }

    private fun showWebUnavailable(message: String?, retryable: Boolean) {
        hideWebContent()
        transientConnectionFailure = retryable
        if (connectionRecovery.running) {
            connectionRecovery.failed(connectionToken, retryable, message)
        } else if (retryable && !foreground) {
            recoverOnResume = true
        } else if (retryable && !isFinishing && !isDestroyed) {
            // Leave the WebView callback before destroying/replacing its view.
            val generation = pairingGeneration
            handler.post { onMain(generation) { bootstrap() } }
        } else {
            recovery.showOffline(familyReachabilityMessage(message), ::bootstrap, ::changeAddress)
        }
    }

    private fun hideWebContent() {
        hasReadyWebContent = false
        publishPresentation(presentationState.update(contentReady = false))
        webView?.visibility = View.GONE
    }

    private fun presentationContentReady(): Boolean =
        hasReadyWebContent && webView?.isShown == true && recovery.visibility != View.VISIBLE

    private fun publishPresentation(snapshot: PresentationSnapshot?) {
        if (snapshot != null) nativeBridge?.sendPresentation(snapshot)
    }

    private fun changeAddress() {
        pairingGeneration += 1
        credentialStore.clear()
        localState.clearOrigin()
        CookieManager.getInstance().removeAllCookies(null)
        destroyWebView()
        showServerEntry()
    }

    private fun handleBack() {
        if (recovery.visibility == View.VISIBLE) {
            connectionRecovery.cancel()
            pairingGeneration += 1
            finishAfterTransition()
            return
        }
        val view = webView
        if (view == null || nativeBridge?.sendBack() != true) {
            if (view?.canGoBack() == true) view.goBack() else finishAfterTransition()
        }
    }

    private fun destroyWebView() {
        hideWebContent()
        val view = webView ?: return
        root.removeView(view)
        view.stopLoading()
        view.webChromeClient = null
        view.webViewClient = WebViewClient()
        view.removeAllViews()
        view.destroy()
        webView = null
        nativeBridge = null
    }

    private fun networkAvailable(): Boolean {
        val manager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = manager.activeNetwork ?: return false
        val capabilities = manager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun onMain(generation: Int, action: () -> Unit) {
        runOnUiThread {
            if (!isFinishing && !isDestroyed && generation == pairingGeneration) action()
        }
    }

    private fun enterTelevisionMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.apply {
                hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility =
                View.SYSTEM_UI_FLAG_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        }
    }

    private companion object {
        const val pairingPollMillis = 1_500L
        const val deviceCookie = "hearth_device"
    }
}

internal fun familyReachabilityMessage(message: String?): String? = message?.takeIf {
    val normalized = it.trim().lowercase()
    normalized.isNotEmpty() && normalized != "timeout" && !normalized.startsWith("net::")
}

private fun pairingErrorMessage(error: Throwable): String? =
    if (error is PairingClientException) error.message else null
