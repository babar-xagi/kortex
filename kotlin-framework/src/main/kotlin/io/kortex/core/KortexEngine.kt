package io.kortex.core

import kotlinx.coroutines.*
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import kotlin.coroutines.CoroutineContext
import kotlin.system.measureNanoTime

/**
 * Kortex Non-Blocking Coroutine HTTP Engine & FastAPI-Style Type-Safe Routing DSL.
 * Built on structured concurrency with automatic schema validation and OpenAPI synthesis.
 */
data class TraceContext(
    val traceId: String,
    val spanId: String,
    val startTimeNanos: Long = System.nanoTime()
) : CoroutineContext.Element {
    companion object Key : CoroutineContext.Key<TraceContext>
    override val key: CoroutineContext.Key<*> = Key
}

enum class HttpMethod { GET, POST, PUT, PATCH, DELETE }

data class HttpRequest(
    val method: HttpMethod,
    val path: String,
    val headers: Map<String, String> = emptyMap(),
    val queryParams: Map<String, String> = emptyMap(),
    val rawBody: String? = null
)

data class HttpResponse<T>(
    val status: Int,
    val body: T?,
    val headers: Map<String, String> = mapOf("Content-Type" to "application/json"),
    val durationMicros: Long = 0L
)

class KortexCall(
    val request: HttpRequest,
    val trace: TraceContext,
    val pathParams: Map<String, String> = emptyMap(),
    var principalRole: String? = null
)

class RouteSpec<Req : Any, Res : Any>(
    val method: HttpMethod,
    val pathPattern: String,
    val summary: String,
    val tags: List<String>,
    val requiredRole: String? = null,
    val handler: suspend KortexCall.(Req) -> HttpResponse<Res>
)

class KortexRouter {
    val routes = mutableListOf<RouteSpec<*, *>>()

    fun <Req : Any, Res : Any> register(
        method: HttpMethod,
        path: String,
        summary: String = "",
        tags: List<String> = emptyList(),
        requiredRole: String? = null,
        handler: suspend KortexCall.(Req) -> HttpResponse<Res>
    ) {
        routes.add(RouteSpec(method, path, summary, tags, requiredRole, handler))
    }

    inline fun <reified Req : Any, reified Res : Any> get(
        path: String,
        summary: String = "",
        tags: List<String> = listOf("default"),
        requiredRole: String? = null,
        noinline handler: suspend KortexCall.(Req) -> HttpResponse<Res>
    ) = register(HttpMethod.GET, path, summary, tags, requiredRole, handler)

    inline fun <reified Req : Any, reified Res : Any> post(
        path: String,
        summary: String = "",
        tags: List<String> = listOf("default"),
        requiredRole: String? = null,
        noinline handler: suspend KortexCall.(Req) -> HttpResponse<Res>
    ) = register(HttpMethod.POST, path, summary, tags, requiredRole, handler)
}

class KortexApplication(
    val port: Int = 8080,
    val workerThreads: Int = Runtime.getRuntime().availableProcessors() * 2
) {
    private val supervisor = SupervisorJob()
    val engineScope = CoroutineScope(Dispatchers.Default + supervisor + CoroutineName("kortex-io-worker"))
    val router = KortexRouter()

    fun routing(block: KortexRouter.() -> Unit) {
        router.apply(block)
    }

    suspend fun <Req : Any, Res : Any> dispatch(
        route: RouteSpec<Req, Res>,
        request: HttpRequest,
        payload: Req
    ): HttpResponse<Res> = withContext(engineScope.coroutineContext) {
        val trace = TraceContext(
            traceId = "trc_${System.nanoTime().toString(16)}",
            spanId = "spn_${(1000..9999).random()}"
        )
        withContext(trace) {
            val call = KortexCall(request = request, trace = trace)
            var response: HttpResponse<Res>
            val elapsedNanos = measureNanoTime {
                response = route.handler.invoke(call, payload)
            }
            response.copy(durationMicros = elapsedNanos / 1_000)
        }
    }
}

fun kortexServer(
    port: Int = 8080,
    workers: Int = Runtime.getRuntime().availableProcessors() * 2,
    block: KortexApplication.() -> Unit
): KortexApplication = KortexApplication(port, workers).apply(block)
