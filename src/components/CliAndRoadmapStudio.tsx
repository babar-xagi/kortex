import React, { useState } from 'react';
import { Terminal, Download, Copy, Check, FileCode, Compass, Layers } from 'lucide-react';
import { ROADMAP_PHASES, FRAMEWORK_BENCHMARKS } from '../data/kortexData';

interface CliAndRoadmapStudioProps {
  initialSection?: 'roadmap' | 'cli';
}

export const CliAndRoadmapStudio: React.FC<CliAndRoadmapStudioProps> = ({
  initialSection = 'roadmap'
}) => {
  const [section, setSection] = useState<'roadmap' | 'cli'>(initialSection);
  const [serviceName, setServiceName] = useState('order-ledger-service');
  const [dbDriver, setDbDriver] = useState<'postgres-r2dbc' | 'mysql-r2dbc' | 'sqlite-coroutines'>('postgres-r2dbc');
  const [authStrategy, setAuthStrategy] = useState<'ed25519-jwt-rbac' | 'oauth2-oidc'>('ed25519-jwt-rbac');
  const [telemetryMode, setTelemetryMode] = useState<'prometheus-otlp' | 'hdr-anomaly-engine'>('hdr-anomaly-engine');
  const [selectedFileKey, setSelectedFileKey] = useState<
    'Application.kt' | 'build.gradle.kts' | 'Models.kt' | 'ROADMAP.md' | 'PHASES.md'
  >('Application.kt');
  const [copiedFile, setCopiedFile] = useState(false);

  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Kortex CLI v1.0.0 (Kotlin 2.1.0 · Coroutines 1.9.0 · R2DBC)',
    'Type "help", "kortex new", "kortex makemigrations", "kortex bench", or "kortex doctor".',
    `$ kortex new ${serviceName} --db=${dbDriver} --auth=${authStrategy} --telemetry=${telemetryMode}`,
    '✔ Synthesized build.gradle.kts with kotlinx-coroutines-core & r2dbc-postgresql',
    '✔ Generated non-blocking Application.kt with Auto-OpenAPI 3.1 & RBAC guards',
    '✔ Initialized KortexORM Models.kt and 0001_initial_schema.sql in 380ms'
  ]);

  const generatedFiles: Record<typeof selectedFileKey, string> = {
    'Application.kt': `package io.kortex.${serviceName.replace(/[^a-z0-9]/gi, '').toLowerCase()}

import io.kortex.core.*
import io.kortex.orm.*
import io.kortex.auth.*
import io.kortex.telemetry.*
import kotlinx.serialization.Serializable

fun main() {
    val server = kortexServer(port = 8080, workers = Runtime.getRuntime().availableProcessors() * 2) {
        // 1. Real-Time DevOps Telemetry & Automated Anomaly Alerting (${telemetryMode})
        install(KortexTelemetry) {
            serviceName = "${serviceName}"
            hdrLatencyHistogram(percentiles = listOf(0.50, 0.95, 0.99))
            anomalyAlertRule(metric = "p99_latency_ms", threshold = 12.0, severity = AlertSeverity.CRITICAL) {
                autoRemediate("SCALE_COROUTINE_DISPATCHER_AND_DRAIN_SLOW_R2DBC")
            }
        }

        // 2. Built-in Security (${authStrategy}) & Django-Style Auto-Admin
        install(KortexAuth) {
            jwt("${authStrategy}") {
                issuer = "https://auth.kortex.internal"
                algorithm = "Ed25519"
            }
        }

        install(KortexAdmin) {
            register(UsersTable, OrdersTable)
        }

        // 3. FastAPI-Style Type-Safe Non-Blocking Coroutine Routing
        routing {
            get<HealthCheckQuery, HealthStatusDto>("/health/live", summary = "Coroutine liveness probe") {
                respondOk(HealthStatusDto(status = "NOMINAL", service = "${serviceName}"))
            }

            authenticate("${authStrategy}") {
                post<CreateOrderRequest, OrderResponse>("/api/v1/orders", requiredRole = "SRE_ADMIN") { req ->
                    val created = OrdersTable.objects.createSuspend(req)
                    respondCreated(created)
                }
            }
        }
    }
    server.startBlocking()
}`,
    'build.gradle.kts': `plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
    application
}

group = "io.kortex.microservices"
version = "1.0.0"

dependencies {
    implementation("io.kortex:kortex-core:1.0.0")
    implementation("io.kortex:kortex-orm-${dbDriver}:1.0.0")
    implementation("io.kortex:kortex-auth-${authStrategy}:1.0.0")
    implementation("io.kortex:kortex-telemetry-${telemetryMode}:1.0.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}

kotlin {
    jvmToolchain(21)
}`,
    'Models.kt': `package io.kortex.${serviceName.replace(/[^a-z0-9]/gi, '').toLowerCase()}.models

import io.kortex.orm.ModelTable

object UsersTable : ModelTable("users") {
    val id = uuid("id")
    val email = varchar("email", unique = true)
    val passwordHash = varchar("password_hash")
    val role = varchar("role", defaultExpr = "'BACKEND_DEV'")
    val isActive = bool("is_active", defaultExpr = "true")
    val createdAt = timestampTz("created_at", defaultExpr = "NOW()")
}

object OrdersTable : ModelTable("orders") {
    val id = uuid("id")
    val customerId = foreignKey("customer_id", UsersTable)
    val amountUsd = decimal("amount_usd")
    val status = varchar("status", defaultExpr = "'SETTLED'")
    val traceId = varchar("trace_id")
    val createdAt = timestampTz("created_at", defaultExpr = "NOW()")
}`,
    'ROADMAP.md': `# Kortex Framework — Strategic Engineering Roadmap (ROADMAP.md)

Kortex unifies FastAPI's coroutine speed and schema ergonomics with Django's ORM migrations, RBAC authentication, and Auto-Admin portal in pure Kotlin.

1. Non-Blocking Coroutine Engine: < 0.45ms p50 dispatch latency, 46,800+ RPS throughput.
2. KortexORM & Automated Migrations: Declarative ModelTable DSL over R2DBC with deterministic UP/DOWN SQL generation.
3. Security & Auto-Admin: Argon2id + Ed25519 JWT guards + zero-boilerplate Admin CRUD & audit trail.
4. Kortex CLI Scaffolder: Instant microservice bootstrap (kortex new, makemigrations, migrate, bench).
5. Real-Time DevOps Telemetry & Alerting: Sub-15µs HDR latency histograms + automated SLA incident runbooks.`,
    'PHASES.md': `# Kortex Framework — 5-Phase Implementation Plan (PHASES.md)

- Phase 01: Non-Blocking Coroutine HTTP Engine & Type-Safe Routing DSL (COMPLETED)
- Phase 02: KortexORM & Automated Database Migration Engine (COMPLETED)
- Phase 03: Security Primitives, RBAC Authentication & Auto-Admin Backoffice (COMPLETED)
- Phase 04: Kortex CLI Project Scaffolder & Microservice Templates (COMPLETED)
- Phase 05: Real-Time DevOps Telemetry & Automated Anomaly Alerting System (ACTIVE RELEASE)`
  };

  const handleRunCliCommand = (cmdInput?: string) => {
    const raw = (cmdInput ?? terminalInput).trim();
    if (!raw) return;
    const nextLogs = [...terminalLogs, `$ ${raw}`];

    if (raw === 'help') {
      nextLogs.push(
        'Available Kortex CLI commands:',
        '  kortex new <name>          Scaffold pure Kotlin coroutine microservice',
        '  kortex makemigrations      Diff ModelTable AST and synthesize SQL migrations',
        '  kortex migrate             Apply pending R2DBC SQL migrations atomically',
        '  kortex bench               Run 256-fiber non-blocking throughput & latency benchmark',
        '  kortex doctor              Verify JVM 21, Coroutines, R2DBC pool, and OTLP health'
      );
    } else if (raw.startsWith('kortex bench')) {
      nextLogs.push(
        'Running 256-coroutine non-blocking benchmark against /api/v1/orders...',
        '  Throughput : 46,840 req/sec',
        '  Latency    : p50 = 0.41ms · p95 = 0.89ms · p99 = 1.38ms',
        '  Allocations: Zero carrier-thread blocks detected'
      );
    } else if (raw.startsWith('kortex makemigrations')) {
      nextLogs.push(
        'Scanning io.kortex.models.* declarations...',
        '✔ Synthesized migrations/0004_auto_schema_diff.sql (UP + DOWN reversible DDL) in 6.4ms'
      );
    } else if (raw.startsWith('kortex migrate')) {
      nextLogs.push(
        'Applying pending migrations over R2DBC PostgreSQL pool...',
        '✔ Applied 0004_auto_schema_diff.sql in 14.2ms (Checksum verified)'
      );
    } else if (raw.startsWith('kortex doctor')) {
      nextLogs.push(
        '✔ Kotlin 2.1.0 + Coroutines 1.9.0 carrier pool: HEALTHY (16 threads)',
        '✔ R2DBC PostgreSQL non-blocking pool: HEALTHY (0 wait queue)',
        '✔ Automated Anomaly Detector: ARMED (4 active SLA rules)'
      );
    } else if (raw.startsWith('kortex new')) {
      const parts = raw.split(' ');
      if (parts[2]) setServiceName(parts[2]);
      nextLogs.push(
        `✔ Scaffolded pure Kotlin microservice '${parts[2] || serviceName}' with KortexORM, Auto-Admin & Telemetry`
      );
    } else {
      nextLogs.push(`Executed '${raw}' in Kortex CLI environment.`);
    }

    setTerminalLogs(nextLogs);
    if (!cmdInput) setTerminalInput('');
  };

  const handleCopyFile = () => {
    navigator.clipboard.writeText(generatedFiles[selectedFileKey]);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 1800);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([generatedFiles[selectedFileKey]], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFileKey;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Header */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Kortex Architecture Roadmap (`ROADMAP.md` & `PHASES.md`) & CLI Project Scaffolder
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect the 5-phase engineering blueprint, benchmark comparisons, or scaffold a pure Kotlin microservice
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-md">
          <button
            onClick={() => setSection('roadmap')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              section === 'roadmap'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Roadmap & Phases (ROADMAP.md / PHASES.md)
          </button>
          <button
            onClick={() => setSection('cli')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              section === 'cli'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CLI Scaffolder & Kotlin Source
          </button>
        </div>
      </div>

      {section === 'roadmap' ? (
        <div className="space-y-6">
          {/* Framework Benchmark Comparison Table */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-lg">
            <div className="p-5 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  01. Throughput & Latency Benchmark: Kortex vs. FastAPI vs. Django vs. Spring WebFlux
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  256 concurrent connections · JSON serialization + non-blocking DB query · 16 vCPU Linux node
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                3.3x Faster than FastAPI · 9.5x Faster than Django
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[11px] font-mono text-slate-400 bg-[#0B0F17]">
                    <th className="py-3 px-4">Framework</th>
                    <th className="py-3 px-4">Runtime</th>
                    <th className="py-3 px-4 text-right">Throughput (RPS)</th>
                    <th className="py-3 px-4 text-right">p50 Latency</th>
                    <th className="py-3 px-4 text-right">p99 Latency</th>
                    <th className="py-3 px-4 text-right">Memory RSS</th>
                    <th className="py-3 px-4">Built-in ORM, Migrations & Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs font-mono">
                  {FRAMEWORK_BENCHMARKS.map((row, idx) => (
                    <tr
                      key={row.framework}
                      className={idx === 0 ? 'bg-indigo-950/30 font-semibold' : 'hover:bg-slate-800/40'}
                    >
                      <td className="py-3 px-4 text-slate-100">{row.framework}</td>
                      <td className="py-3 px-4 text-slate-400">{row.language}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 tabular-nums">
                        {row.rpsThroughput.toLocaleString()} req/s
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200 tabular-nums">
                        {row.p50LatencyMs.toFixed(2)} ms
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200 tabular-nums">
                        {row.p99LatencyMs.toFixed(2)} ms
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 tabular-nums">
                        {row.memoryMb} MB
                      </td>
                      <td className="py-3 px-4 text-slate-300">{row.builtInOrmAndAdmin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5 Sequential Engineering Phases */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-lg divide-y divide-[#1E293B]">
            <div className="p-5">
              <h3 className="text-base font-semibold text-slate-100">
                02. Phased Implementation Blueprint (`PHASES.md`)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sequential execution phases from core coroutine I/O to automated DevOps anomaly alerting
              </p>
            </div>

            {ROADMAP_PHASES.map((phase) => (
              <div key={phase.phaseNumber} className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-indigo-400 font-semibold">{phase.phaseNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        phase.status === 'ACTIVE_RELEASE' ? 'text-emerald-400' : 'text-slate-300'
                      }
                    >
                      {phase.status}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">{phase.targetSla}</span>
                  </div>

                  <h4 className="text-base font-semibold text-slate-100">{phase.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{phase.summary}</p>

                  <ul className="space-y-1 text-xs text-slate-400 pt-1">
                    {phase.deliverables.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono text-indigo-400">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-xs font-mono text-emerald-400 pt-1">
                    {phase.verificationMetric}
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <pre className="p-3.5 bg-[#0B0F17] border border-[#1E293B] rounded-md text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed h-full">
                    <code>{phase.kotlinSnippet}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* CLI Scaffolder & Source Generator */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: CLI Configurator + Interactive Terminal */}
          <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-lg divide-y divide-[#1E293B]">
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  01. Kortex CLI Microservice Scaffolder
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure parameters to synthesize a production-ready Kotlin 2.1 project
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Microservice Artifact Name</label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#0B0F17] border border-[#1E293B] rounded text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Non-Blocking KortexORM Driver</label>
                  <select
                    value={dbDriver}
                    onChange={(e) => setDbDriver(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#0B0F17] border border-[#1E293B] rounded text-slate-100"
                  >
                    <option value="postgres-r2dbc">PostgreSQL (r2dbc-postgresql)</option>
                    <option value="mysql-r2dbc">MySQL 8 (r2dbc-mysql)</option>
                    <option value="sqlite-coroutines">SQLite (coroutine-wal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Authentication & Admin Guard</label>
                  <select
                    value={authStrategy}
                    onChange={(e) => setAuthStrategy(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#0B0F17] border border-[#1E293B] rounded text-slate-100"
                  >
                    <option value="ed25519-jwt-rbac">Ed25519 JWT + Argon2id + Auto-Admin</option>
                    <option value="oauth2-oidc">OAuth2 / OIDC Enterprise Guard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Observability & Anomaly Engine</label>
                  <select
                    value={telemetryMode}
                    onChange={(e) => setTelemetryMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#0B0F17] border border-[#1E293B] rounded text-slate-100"
                  >
                    <option value="hdr-anomaly-engine">HDR Histogram + Automated SLA Alerting</option>
                    <option value="prometheus-otlp">Prometheus + OpenTelemetry gRPC</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() =>
                    handleRunCliCommand(
                      `kortex new ${serviceName} --db=${dbDriver} --auth=${authStrategy}`
                    )
                  }
                  className="px-3 py-1.5 text-xs font-mono bg-indigo-600 hover:bg-indigo-500 text-white rounded cursor-pointer"
                >
                  Run kortex new
                </button>
                <button
                  onClick={() => handleRunCliCommand('kortex bench --concurrency=256')}
                  className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                >
                  Run kortex bench
                </button>
                <button
                  onClick={() => handleRunCliCommand('kortex doctor')}
                  className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                >
                  Run kortex doctor
                </button>
              </div>
            </div>

            {/* Interactive CLI Terminal */}
            <div className="p-5 space-y-3">
              <div className="text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>Interactive Kortex CLI Shell</span>
                <span className="text-slate-500">bash · kortex-cli 1.0</span>
              </div>

              <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-md h-56 overflow-y-auto font-mono text-xs space-y-1 text-slate-300">
                {terminalLogs.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith('$')
                        ? 'text-indigo-400 font-semibold'
                        : line.startsWith('✔')
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunCliCommand();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Type command (e.g. kortex bench, kortex makemigrations, help)..."
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#0B0F17] border border-[#1E293B] rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-mono bg-indigo-600 hover:bg-indigo-500 text-white rounded cursor-pointer"
                >
                  Execute
                </button>
              </form>
            </div>
          </div>

          {/* Right 7 Cols: Generated Pure Kotlin Project Files */}
          <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-lg">
            <div className="p-4 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-md">
                {(
                  [
                    'Application.kt',
                    'build.gradle.kts',
                    'Models.kt',
                    'ROADMAP.md',
                    'PHASES.md'
                  ] as const
                ).map((fileKey) => (
                  <button
                    key={fileKey}
                    onClick={() => setSelectedFileKey(fileKey)}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                      selectedFileKey === fileKey
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fileKey}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFile}
                  className="px-3 py-1.5 text-xs font-mono bg-[#0B0F17] hover:bg-slate-800 text-slate-200 border border-[#1E293B] rounded-md flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="px-3 py-1.5 text-xs font-mono bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download {selectedFileKey}
                </button>
              </div>
            </div>

            <div className="p-5">
              <pre className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-md text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                <code>{generatedFiles[selectedFileKey]}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
