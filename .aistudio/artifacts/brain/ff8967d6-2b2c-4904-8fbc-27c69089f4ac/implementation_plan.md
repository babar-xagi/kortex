# Kortex — Pure Kotlin Coroutine Web Framework & Real-Time Observability Studio

**Kortex** is a next-generation, pure-Kotlin backend framework and interactive engineering studio that unites the rapid, zero-boilerplate ergonomics and automatic OpenAPI schema generation of **FastAPI** with the batteries-included power of **Django** (declarative ORM, automated database migrations, RBAC authentication, and instant Admin interface)—all built atop non-blocking **Kotlin Coroutines** for sub-millisecond latency, paired with a real-time **DevOps Telemetry & Automated Incident Alerting Console** and **CLI Project Scaffolder**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices incorporate your confirmed preferences from our alignment step and define how both the pure Kotlin framework core and the interactive web studio will operate.

- **Confirmed Decision 1 — Syntax & Framework Ergonomics**: **Coroutine DSL with Type-Safe Schemas**. Routes, middleware, ORM entities, and dependency injection use idiomatic Kotlin coroutine builders (`routing { get<UserQuery, UserResponse>("/users") { ... } }`) with compile-time type safety and automatic OpenAPI 3.1 contract synthesis.
- **Confirmed Decision 2 — Application Experience**: **Full Interactive Studio with Live Telemetry, CLI Scaffolder, ORM Migration Simulator, Admin Portal & Roadmap Explorer**. The web application brings the entire Kotlin framework ecosystem to life: developers can inspect and run real pure-Kotlin framework code, execute interactive ORM schema migrations, test JWT/RBAC auth and the Django-style Auto-Admin panel, generate downloadable multi-module Kotlin projects via the CLI Scaffolder, and monitor microservice health with real-time telemetry and automated anomaly alerting.
- **Confirmed Decision 3 — Visual Aesthetic Direction**: **High-Contrast Dark Engineering Console**. Styled with a deep slate/obsidian canvas (`#0B0F17`), crisp 1px structural hairlines (`#1E293B`), `Plus Jakarta Sans` for structural headers, and `JetBrains Mono` (`tabular-nums`) for all Kotlin DSL code, SQL migrations, latency percentiles, throughput counters, and CLI output.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Kortex Pure Kotlin Framework Engine**: Provides a complete, idiomatic Kotlin framework architecture featuring a non-blocking Coroutine HTTP/WebSocket Router, declarative **KortexORM** with automated diff-based SQL migration generation (`makemigrations` / `migrate`), built-in Security & Auth (Argon2id, JWT/OAuth2, fine-grained RBAC permissions, CSRF/CORS), an automatic **Kortex Admin** CRUD & audit portal, and a **Kortex CLI** project generator.
  2. **Real-Time DevOps Telemetry & Incident Alerting Control Plane**: Streams live, high-frequency microservice telemetry (p50/p95/p99 latency, RPS throughput, active coroutine continuations, HikariCP/R2DBC connection pool saturation, and error rates) with an **Automated Anomaly Detection & Alerting Engine** that detects latency spikes, error surges, and connection leaks, triggering instant incident playbooks for DevOps teams.
  3. **Interactive Roadmap & Phased Architecture Blueprint**: Includes both project documentation (`ROADMAP.md` and `PHASES.md`) and an interactive Roadmap & Phase Tracker inside the studio so engineering teams can inspect milestones, benchmark targets, and architectural deliverables across every phase.
- **Target Audience / Persona**: Kotlin backend engineers, systems architects, and DevOps/SRE teams who want the developer velocity of FastAPI and the completeness of Django without sacrificing JVM/Native coroutine performance or production observability.
- **Key Value**: Eliminates the trade-off between rapid prototyping and production readiness—delivering a single cohesive Kotlin DSL from database table to OpenAPI endpoint to live SRE incident response.

---

## 2. Framework Roadmap & Phased Execution Plan (`ROADMAP.md` & `PHASES.md`)

> [!NOTE]
> Per your request to establish the **Roadmap** and **Phases** first, the complete phased engineering roadmap below governs the implementation and will also be persisted as standalone documentation artifacts (`ROADMAP.md` and `PHASES.md`) and an interactive **Roadmap & Phases** workspace view.

### Phase 1: Non-Blocking Coroutine HTTP Engine & Type-Safe Routing DSL
- **Objective**: Achieve sub-millisecond request dispatch and maximum throughput using structured concurrency (`CoroutineScope`, `SupervisorJob`, zero-copy byte buffers) and FastAPI-style automatic validation.
- **Deliverables**:
  - Suspendable routing DSL (`kortexApp { routing { get, post, put, delete, ws } }`) with path, query, header, and body destructuring.
  - Compile-time `kotlinx.serialization` schema binding with automatic HTTP 422 validation diagnostics and live OpenAPI 3.1 / Swagger interactive spec generation.
  - Zero-allocation coroutine context propagation for request tracing (`TraceId`, `SpanId`, `AuthPrincipal`).

### Phase 2: KortexORM & Automated Database Migration Engine (Django-Style)
- **Objective**: Provide a declarative, coroutine-native ORM over R2DBC/PostgreSQL with zero-downtime schema evolution.
- **Deliverables**:
  - Declarative `ModelTable` DSL supporting relations (`belongsTo`, `hasMany`, `manyToMany`), composite indexes, and suspendable query builders (`User.objects.filter { ... }.orderBy(...)`).
  - Diff-based Migration Engine (`kortex makemigrations` & `kortex migrate`) that compares Kotlin entity definitions against current schema state, generates reversible UP/DOWN SQL migrations, and detects destructive operations prior to execution.
  - Interactive ORM & Migration Playground in the Studio where edits to Kotlin models synthesize real-time SQL DDL diffs and execute against an interactive state store.

### Phase 3: Batteries-Included Security, RBAC Authentication & Auto-Admin Portal
- **Objective**: Out-of-the-box enterprise security and an instant operational admin backoffice modeled after Django Admin.
- **Deliverables**:
  - Built-in Auth Guard DSL (`authenticate("jwt-rbac") { requireRole("SRE_ADMIN") { ... } }`), OAuth2/OIDC providers, Argon2id password hashing, and rate-limiting middleware.
  - **Kortex Auto-Admin**: Zero-boilerplate model registration (`admin.register(UserTable, OrderTable, AuditLogTable)`) that automatically renders a full CRUD data grid, search/filter bar, bulk actions, role matrix editor, and immutable audit trail.

### Phase 4: Kortex CLI Project Scaffolder & Microservice Templates
- **Objective**: Enable developers to bootstrap production-ready Kotlin microservices in seconds.
- **Deliverables**:
  - Interactive CLI emulator & command builder (`kortex new <service-name> --db=postgres --auth=jwt --observability=prometheus --docker`).
  - Dynamic generation of complete Kotlin source code (`build.gradle.kts`, `Application.kt`, `Models.kt`, `Migrations.kt`, `SecurityConfig.kt`, `Dockerfile`, and `kortex.yaml`) with instant inspection and bundle export.

### Phase 5: Real-Time DevOps Telemetry & Automated Anomaly Alerting System
- **Objective**: Provide low-overhead, real-time observability for active deployments and instant incident response for DevOps teams.
- **Deliverables**:
  - Live streaming telemetry engine tracking Request Latency (`p50`, `p95`, `p99` in ms), Throughput (`req/sec`), Active Coroutines (dispatcher thread utilization vs. suspended continuations), and Database Connection Pool metrics.
  - **Chaos & Load Injection Controls**: Simulate realistic production scenarios (Traffic Spike 25k RPS, Slow SQL Lock Contention, Coroutine Dispatcher Starvation, Memory Pressure, Auth Brute-Force Wave) to verify telemetry responsiveness.
  - **Automated Anomaly Alerting & Incident Response Engine**: Configurable threshold and z-score anomaly detectors that fire real-time P1/P2/P3 alerts, auto-correlate root-cause spans, and allow DevOps engineers to execute one-click remediation playbooks (e.g., *Scale Coroutine Worker Pool*, *Trip Circuit Breaker*, *Kill Blocking Queries*, *Acknowledge & Resolve Incident*).

---

## 3. User Experience & Visual Design

- **Workspace Layout & Top Bar Contract**:
  - Full-viewport desktop engineering console (`1440px+` baseline) structured around a 260px left navigation sidebar, a strict 3-zone top bar (Brand wordmark `Kortex` on the left, 5 single-line workspace navigation links in the center, and 1 primary action button `"Trigger Load Test"` / `"Export Kotlin Project"` on the right), and a high-density main viewport.
- **Key User Flows**:
  1. **Real-Time Telemetry & Incident Command Center**: View live streaming latency (`p50`/`p95`/`p99`), throughput (`RPS`), coroutine states, and endpoint health tables. Inject live traffic anomalies or chaos scenarios, watch the automated alerting engine trigger P1 incident banners with root-cause trace correlation, configure alert rules, and execute instant remediation actions.
  2. **Kotlin DSL & FastAPI-Style Interactive Playground**: Select or edit pure Kotlin coroutine endpoints, inspect auto-generated OpenAPI schemas, send simulated non-blocking requests with custom payloads, and inspect sub-millisecond execution traces stage-by-stage (Coroutine Dispatch -> Auth Guard -> Validation -> KortexORM Query -> Serialization).
  3. **KortexORM & Migration Studio**: Inspect and modify Kotlin `ModelTable` definitions, run `kortex makemigrations` to generate versioned UP/DOWN SQL migration scripts, and run `kortex migrate` or rollback while viewing live schema state.
  4. **Kortex Auto-Admin & Security RBAC**: Browse and mutate registered ORM models (`Users`, `ApiTokens`, `ServiceNodes`, `AuditLogs`), manage JWT/RBAC roles, and test permission boundaries.
  5. **Kortex CLI Scaffolder**: Configure microservice options interactively or run commands in the integrated terminal (`kortex new`, `kortex makemigrations`, `kortex bench`, `kortex doctor`) and browse/download the generated pure Kotlin project files.
  6. **Roadmap & Architecture Phases**: Interactive blueprint of `ROADMAP.md` and `PHASES.md` with phase completion status, architecture benchmarks (Kortex vs. FastAPI vs. Django vs. Spring Boot), and design specifications.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Precision Dark Engineering Console inspired by high-performance observability and developer platforms.
  - *Color Palette & Mood* (60-30-10 Discipline):
    - **60% Dominant Neutral Canvas**: Deep Obsidian Slate (`#0B0F17`) main background.
    - **30% Structural Surfaces**: Elevated Slate (`#111827`) panels with crisp `1px solid #1E293B` borders and Muted Slate (`#94A3B8`) secondary copy.
    - **10% Accent & Semantic State Budget**: Kotlin Indigo/Violet (`#6366F1` / `#8B5CF6`) for active interactive controls, plus semantic telemetry indicators always paired with explicit text labels: Nominal Green (`#10B981`), Warning Amber (`#F59E0B`), and Critical Anomaly Crimson (`#EF4444`).
  - *Typography & Hierarchy* (2+1 Font Rule):
    - **Display / Navigation**: `Plus Jakarta Sans` (SemiBold 600 / Bold 700, `text-wrap: balance`).
    - **Body Prose**: `Plus Jakarta Sans` (Regular 400 / Medium 500, 14px–15px).
    - **Code, Telemetry & Tabular Metrics**: `JetBrains Mono` with `font-variant-numeric: tabular-nums` enforced on all latency charts, RPS counters, timestamps, SQL diffs, and Kotlin source blocks.
  - *Anti-Slop & Restraint Rules*: Zero static pill badges on metadata (all metadata rendered as clean inline text with `·` or `/` separators), single-elevation flat panels with `1px` borders (no nested card sandwiches or thick `border-l-4` stripes), and every button wired to a real stateful mutation.

---

## 4. Key Product Decisions & Trade-Offs

- **Decision 1: Interactive Browser-Based Kotlin Framework Runtime + Downloadable Pure Kotlin Source**
  - *Chosen Approach*: Pair a rich, deterministic Kotlin Coroutine & ORM simulation engine (backed by Express API endpoints and a real-time telemetry state loop) with authentic, copy-ready and downloadable pure-Kotlin project files (`build.gradle.kts`, Coroutine Netty/Ktor engine bindings, KortexORM DSL, and CLI script).
  - *Why*: Allows developers and DevOps teams to immediately experience sub-millisecond routing, ORM migrations, admin CRUD, and live anomaly alerting inside the browser while also providing genuine Kotlin source code and `ROADMAP.md` / `PHASES.md` documentation.
  - *Alternatives Considered*: Static documentation site (rejected because it cannot demonstrate live telemetry, anomaly alerting, or interactive migrations).
- **Decision 2: Automated Z-Score & Threshold Anomaly Engine with One-Click Runbooks**
  - *Chosen Approach*: Build a stateful anomaly detector that evaluates rolling telemetry windows against configurable SLA rules (e.g., `p99 Latency > 15ms`, `5xx Error Rate > 1.5%`, `Coroutine Pool Saturation > 85%`, `DB Pool Pending > 10`) and provides interactive incident response actions that genuinely alter the live telemetry stream.
  - *Why*: Directly fulfills the requirement for seamless performance monitoring, rapid debugging during active deployments, and automated alerting for instant DevOps incident response.

---

## 5. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                        KORTEX STUDIO & CONTROL PLANE (1440px)                        │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Top Bar: [Kortex] ── [Telemetry · Playground · ORM · Admin · CLI · Roadmap]    │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Context      │  │ Active Workspace Viewport                                    │  │
│  │ Sidebar      │  │  ├─ 1. Live DevOps Telemetry & Automated Alerting Console    │  │
│  │              │  │  │     ├─ Real-Time Latency (p50/p95/p99) & RPS Stream       │  │
│  │ · Cluster    │  │  │     ├─ Coroutine Continuation & DB Pool Monitors          │  │
│  │   Nodes      │  │  │     ├─ Chaos/Traffic Injector & Anomaly Rule Engine       │  │
│  │ · Active     │  │  │     └─ Incident Feed + One-Click Remediation Runbooks     │  │
│  │   Incidents  │  │  ├─ 2. Pure Kotlin Coroutine DSL & OpenAPI Playground        │  │
│  │ · ORM Schema │  │  │     ├─ Kotlin Route & Schema Editor + Request Simulator   │  │
│  │   Version    │  │  │     └─ Non-Blocking Coroutine Execution Span Waterfall    │  │
│  │ · Quick CLI  │  │  ├─ 3. KortexORM & Database Migration Studio                 │  │
│  │   Launcher   │  │  │     ├─ ModelTable DSL Inspector & Schema Diff Generator   │  │
│  │              │  │  │     └─ Migration History (makemigrations / migrate / SQL) │  │
│  │              │  │  ├─ 4. Kortex Auto-Admin & RBAC Security Portal              │  │
│  │              │  │  │     └─ Registered Models CRUD, JWT Tester & Audit Trail   │  │
│  │              │  │  └─ 5. Kortex CLI Scaffolder & Roadmap/Phases Explorer       │  │
│  └──────────────┘  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────┬───────────────────────────────────────┘
                                               │ REST & Live Telemetry Stream
┌──────────────────────────────────────────────▼───────────────────────────────────────┐
│                   KORTEX SIMULATION & TELEMETRY ENGINE (Express API)                 │
│  ├─ Telemetry Aggregator: Rolling 60s window metrics, latency histograms, chaos mode │
│  ├─ Anomaly Detector: Evaluates SLA thresholds & fires/resolves Incident records     │
│  ├─ KortexORM & Admin Store: Stateful entities, SQL migration ledger, RBAC audit log │
│  └─ Kotlin Project Synthesizer: Generates pure Kotlin source files + ROADMAP/PHASES  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`TelemetryTick`**: `timestamp`, `rps`, `p50LatencyMs`, `p95LatencyMs`, `p99LatencyMs`, `activeCoroutines`, `suspendedContinuations`, `dbPoolActive`, `dbPoolIdle`, `dbPoolWait`, `errorRatePct`, `cpuLoadPct`, `heapUsedMb`.
- **`AlertRule`**: `id`, `name`, `metric`, `operator`, `threshold`, `windowSec`, `severity` (`CRITICAL` | `WARNING` | `INFO`), `enabled`, `autoRemediationAction`.
- **`IncidentAlert`**: `id`, `ruleId`, `title`, `serviceNode`, `severity`, `status` (`FIRING` | `ACKNOWLEDGED` | `RESOLVED`), `triggeredAt`, `resolvedAt`, `metricValue`, `rootCauseTraceId`, `remediationApplied`.
- **`KotlinRouteSpec`**: `id`, `method`, `path`, `summary`, `authScope`, `kotlinDslCode`, `requestSchema`, `responseSchema`, `avgLatencyUs`.
- **`OrmModelSpec` & `MigrationRecord`**: `tableName`, `kotlinModelCode`, `columns`, `relations`, `migrationId`, `version`, `description`, `upSql`, `downSql`, `appliedAt`, `status`.
- **`AdminRecord` & `AuditEntry`**: Dynamic records for `Users`, `ServiceTokens`, `FeatureFlags`, and `Deployments` with RBAC role enforcement and mutation logs.

### Interactive Component & State Mapping

- **Live Telemetry & Chaos Controls**: Toggling stream pause/resume, time window (`1m`, `5m`, `15m`), or injecting a chaos scenario (`Traffic Surge 30k RPS`, `DB Connection Leak`, `Slow Coroutine I/O`, `Auth Spike`) immediately mutates the telemetry generator parameters, causing latency/RPS curves to respond in real time and automatically firing matching `IncidentAlert` records when thresholds are breached.
- **Incident Alerting & Runbook Execution**: Clicking `"Acknowledge"`, `"Execute Auto-Remediation"` (e.g., *Drain Slow Queries*, *Scale Dispatcher Threads*, *Enable Rate Limiter*), or `"Resolve"` updates the incident state, logs an audit entry, and restores nominal telemetry parameters. Users can also create or toggle custom `AlertRule` thresholds via modal/drawer controls.
- **Kotlin DSL Route & OpenAPI Tester**: Selecting any route or editing request JSON and clicking `"Execute Coroutine Request"` runs validation against the route schema, returns a realistic typed response with sub-millisecond timing breakdown, and appends a live span trace to the debugger.
- **ORM Migration Lifecycle**: Adding or modifying fields in the Kotlin `ModelTable` editor and clicking `"Run makemigrations"` computes a new `MigrationRecord` with exact PostgreSQL `ALTER TABLE` / `CREATE INDEX` UP and DOWN SQL statements; clicking `"Apply migrate"` transitions its status to `APPLIED` and updates the live Admin schema.
- **CLI Scaffolder & Roadmap Viewer**: Running CLI commands or toggling project flags dynamically updates the generated Kotlin project bundle and allows switching between `ROADMAP.md`, `PHASES.md`, and pure `.kt` source files with one-click copy or download.
