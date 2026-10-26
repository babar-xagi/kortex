# Kortex Framework — Phased Implementation Blueprint (`PHASES.md`)

This document defines the 5 sequential engineering phases for building, verifying, and operating the **Kortex** pure Kotlin framework and its integrated DevOps observability control plane.

---

## Phase 1: High-Performance Coroutine I/O & FastAPI-Style Routing DSL

### Engineering Scope
- **Zero-Blocking Dispatch Pipeline**: Every incoming socket connection is handled via non-blocking NIO channels mapped to a dedicated Kotlin `CoroutineDispatcher` with `CoroutineContext` propagation for `TraceContext` and `SecurityPrincipal`.
- **Compile-Time Type-Safe Contracts**: Instead of runtime reflection overhead, Kortex leverages Kotlin KSP and `kotlinx.serialization` descriptors to validate payloads and synthesize OpenAPI 3.1 schemas at startup.

### Core Kotlin DSL Contract
```kotlin
val app = kortexServer(port = 8080, workers = Runtime.getRuntime().availableProcessors() * 2) {
    install(OpenApiPlugin) {
        title = "Order Microservice API"
        version = "1.4.0"
    }
    routing {
        post<CreateOrderRequest, OrderResponse>("/api/v1/orders", summary = "Create non-blocking order") { req ->
            val order = OrderService.createAsync(req, call.traceContext)
            respondCreated(order)
        }
    }
}
```

### Verification Criteria
- Sub-millisecond p99 routing overhead at 25,000+ RPS.
- Automatic HTTP 422 validation error responses with field-level paths on malformed JSON payloads.

---

## Phase 2: KortexORM & Automated Database Migrations (Django-Style)

### Engineering Scope
- **Declarative Schema DSL**: Define PostgreSQL/MySQL/SQLite tables using pure Kotlin objects extending `ModelTable<ID>`.
- **Suspendable Query Execution**: All queries execute asynchronously over R2DBC connection pools without pinning OS threads.
- **Deterministic Migration Synthesis (`makemigrations` & `migrate`)**: AST snapshot comparison generates timestamped, reversible SQL migration files and guards against unapproved column drops.

### Core Kotlin DSL Contract
```kotlin
object UsersTable : LongIdTable("users") {
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    val role = enumerationByName<UserRole>("role", 32).default(UserRole.DEVELOPER)
    val isActive = bool("is_active").default(true)
    val createdAt = timestampWithTimeZone("created_at").defaultNow()
}

// Suspendable Django-inspired query syntax
val activeAdmins = UsersTable.objects
    .filter { (UsersTable.role eq UserRole.SRE_ADMIN) and (UsersTable.isActive eq true) }
    .orderBy(UsersTable.createdAt to SortOrder.DESC)
    .limit(50)
    .toList()
```

---

## Phase 3: Secure Authentication, RBAC & Auto-Admin Portal

### Engineering Scope
- **Security Primitives**: Built-in Argon2id password hasher, JWT/EdDSA token issuer and verifier, CSRF protection, and sliding-window rate limiters.
- **Django-Style Auto-Admin**: Register any `ModelTable` with `adminSite.register(...)` to expose an authenticated backoffice UI with pagination, search, filters, role auditing, and mutation logs.

### Core Kotlin DSL Contract
```kotlin
install(KortexAuth) {
    jwt("rbac-jwt") {
        issuer = "https://auth.kortex.internal"
        audience = "kortex-microservices"
        verifier(Ed25519KeyProvider.fromEnv("KORTEX_PUBLIC_KEY"))
    }
}

install(KortexAdmin) {
    siteHeader = "Kortex Production Control Plane"
    register(UsersTable) {
        listDisplay = listOf(UsersTable.id, UsersTable.email, UsersTable.role, UsersTable.isActive)
        searchFields = listOf(UsersTable.email)
        readOnlyFields = listOf(UsersTable.createdAt)
    }
}
```

---

## Phase 4: CLI Project Scaffolding & Microservice Bootstrap

### Engineering Scope
- **Single-Command Project Generation**: `kortex new <project-name>` scaffolds a complete multi-module or single-service Kotlin project with preconfigured Gradle version catalogs, KortexORM migrations, JWT security, Prometheus/OTLP exporters, and Dockerfile.
- **Diagnostic & Migration Commands**:
  - `kortex new <name> --db=postgres --auth=jwt --telemetry=otlp`
  - `kortex makemigrations --name=<migration_label>`
  - `kortex migrate --target=latest`
  - `kortex bench --concurrency=256 --duration=30s`
  - `kortex doctor`

---

## Phase 5: Real-Time DevOps Telemetry & Automated Anomaly Alerting

### Engineering Scope
- **Zero-Allocation Coroutine Telemetry**: Intercepts coroutine continuation resume/suspend events and R2DBC pool acquisitions with `< 15µs` overhead.
- **Real-Time Metrics Stream**: Continuous export of `p50`, `p95`, and `p99` latency, RPS throughput, active vs. suspended coroutines, and DB pool wait queues.
- **Automated Anomaly Detection & Instant Incident Response**:
  - Evaluates rolling telemetry windows against SLA thresholds and statistical z-scores.
  - Fires categorized P1/P2/P3 alerts with correlated trace IDs (`TraceId`) and affected endpoints.
  - Executes automated or one-click DevOps remediation runbooks (*Scale Coroutine Worker Pool*, *Trip Endpoint Circuit Breaker*, *Terminate Slow SQL Queries*, *Flush Connection Pool*).
