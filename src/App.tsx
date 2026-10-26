import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Code2,
  Database,
  ShieldCheck,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  TelemetryPoint,
  ChaosScenarioId,
  AlertRule,
  IncidentAlert,
  INITIAL_ALERT_RULES,
  INITIAL_ORM_MODELS,
  INITIAL_MIGRATIONS,
  INITIAL_ADMIN_USERS,
  INITIAL_ADMIN_ORDERS,
  INITIAL_AUDIT_LOGS,
  OrmModelSpec,
  MigrationRecord,
  OrmColumn,
  AdminUserRecord,
  AdminOrderRecord,
  AdminAuditRecord
} from './data/kortexData';
import { TelemetryAlertingView } from './components/TelemetryAlertingView';
import { CoroutineDslPlayground } from './components/CoroutineDslPlayground';
import { OrmMigrationStudio } from './components/OrmMigrationStudio';
import { AutoAdminPortal } from './components/AutoAdminPortal';
import { CliAndRoadmapStudio } from './components/CliAndRoadmapStudio';

type WorkspaceTab = 'telemetry' | 'dsl' | 'orm' | 'admin' | 'cli_roadmap';

function formatTimeHMS(date: Date): string {
  return date.toTimeString().split(' ')[0];
}

function generateTelemetryTick(
  scenario: ChaosScenarioId,
  epochMs: number
): TelemetryPoint {
  const jitter = () => (Math.random() - 0.5) * 2;

  switch (scenario) {
    case 'traffic_spike':
      return {
        timestamp: formatTimeHMS(new Date(epochMs)),
        epochMs,
        rps: Math.round(37800 + jitter() * 1400),
        p50Ms: +(2.4 + Math.random() * 0.6).toFixed(2),
        p95Ms: +(11.2 + Math.random() * 1.8).toFixed(2),
        p99Ms: +(19.4 + Math.random() * 2.5).toFixed(2),
        activeCoroutines: Math.round(4350 + jitter() * 220),
        suspendedContinuations: Math.round(1890 + jitter() * 140),
        dbPoolActive: 58,
        dbPoolIdle: 6,
        dbPoolWait: Math.round(8 + Math.random() * 4),
        errorRatePct: +(0.45 + Math.random() * 0.3).toFixed(2),
        cpuPct: Math.round(84 + jitter() * 4),
        heapMb: 192
      };
    case 'db_lock_contention':
      return {
        timestamp: formatTimeHMS(new Date(epochMs)),
        epochMs,
        rps: Math.round(9200 + jitter() * 600),
        p50Ms: +(6.8 + Math.random() * 1.2).toFixed(2),
        p95Ms: +(24.5 + Math.random() * 3.1).toFixed(2),
        p99Ms: +(44.8 + Math.random() * 4.2).toFixed(2),
        activeCoroutines: Math.round(3820 + jitter() * 180),
        suspendedContinuations: Math.round(3410 + jitter() * 190),
        dbPoolActive: 64,
        dbPoolIdle: 0,
        dbPoolWait: Math.round(29 + Math.random() * 6),
        errorRatePct: +(2.65 + Math.random() * 0.45).toFixed(2),
        cpuPct: Math.round(48 + jitter() * 5),
        heapMb: 164
      };
    case 'coroutine_starvation':
      return {
        timestamp: formatTimeHMS(new Date(epochMs)),
        epochMs,
        rps: Math.round(5400 + jitter() * 500),
        p50Ms: +(14.2 + Math.random() * 2.0).toFixed(2),
        p95Ms: +(39.0 + Math.random() * 4.0).toFixed(2),
        p99Ms: +(68.5 + Math.random() * 6.0).toFixed(2),
        activeCoroutines: Math.round(6400 + jitter() * 300),
        suspendedContinuations: Math.round(8920 + jitter() * 350),
        dbPoolActive: 28,
        dbPoolIdle: 36,
        dbPoolWait: 2,
        errorRatePct: +(3.8 + Math.random() * 0.6).toFixed(2),
        cpuPct: 99,
        heapMb: 248
      };
    case 'auth_anomaly_wave':
      return {
        timestamp: formatTimeHMS(new Date(epochMs)),
        epochMs,
        rps: Math.round(26800 + jitter() * 1100),
        p50Ms: +(0.95 + Math.random() * 0.25).toFixed(2),
        p95Ms: +(4.2 + Math.random() * 0.8).toFixed(2),
        p99Ms: +(9.6 + Math.random() * 1.4).toFixed(2),
        activeCoroutines: Math.round(2150 + jitter() * 150),
        suspendedContinuations: Math.round(620 + jitter() * 80),
        dbPoolActive: 34,
        dbPoolIdle: 30,
        dbPoolWait: 0,
        errorRatePct: +(7.15 + Math.random() * 0.85).toFixed(2),
        cpuPct: Math.round(76 + jitter() * 4),
        heapMb: 142
      };
    case 'nominal':
    default:
      return {
        timestamp: formatTimeHMS(new Date(epochMs)),
        epochMs,
        rps: Math.round(14600 + jitter() * 450),
        p50Ms: +(0.39 + Math.random() * 0.06).toFixed(2),
        p95Ms: +(0.84 + Math.random() * 0.12).toFixed(2),
        p99Ms: +(1.36 + Math.random() * 0.18).toFixed(2),
        activeCoroutines: Math.round(840 + jitter() * 45),
        suspendedContinuations: Math.round(210 + jitter() * 25),
        dbPoolActive: 18,
        dbPoolIdle: 46,
        dbPoolWait: 0,
        errorRatePct: +(0.02 + Math.random() * 0.03).toFixed(2),
        cpuPct: Math.round(28 + jitter() * 3),
        heapMb: 94
      };
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('telemetry');
  const [activeScenario, setActiveScenario] = useState<ChaosScenarioId>('nominal');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(INITIAL_ALERT_RULES);
  const [incidents, setIncidents] = useState<IncidentAlert[]>([]);

  // Initialize 30 seconds of rolling telemetry history
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => {
    const now = Date.now();
    return Array.from({ length: 30 }, (_, idx) =>
      generateTelemetryTick('nominal', now - (29 - idx) * 1000)
    );
  });

  // ORM & Migrations state
  const [ormModels, setOrmModels] = useState<OrmModelSpec[]>(INITIAL_ORM_MODELS);
  const [migrations, setMigrations] = useState<MigrationRecord[]>(INITIAL_MIGRATIONS);

  // Auto-Admin & Audit state
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(INITIAL_ADMIN_USERS);
  const [adminOrders, setAdminOrders] = useState<AdminOrderRecord[]>(INITIAL_ADMIN_ORDERS);
  const [auditLogs, setAuditLogs] = useState<AdminAuditRecord[]>(INITIAL_AUDIT_LOGS);

  const evaluateRulesAgainstTick = useCallback(
    (tick: TelemetryPoint, currentRules: AlertRule[]) => {
      setIncidents((prevIncidents) => {
        let updated = [...prevIncidents];

        for (const rule of currentRules) {
          if (!rule.enabled) continue;
          const rawValue = tick[rule.metricKey];
          const breached =
            rule.operator === '>' ? rawValue > rule.threshold : rawValue >= rule.threshold;

          if (breached) {
            const alreadyFiring = updated.some(
              (inc) => inc.ruleId === rule.id && inc.status !== 'RESOLVED'
            );
            if (!alreadyFiring) {
              const newIncident: IncidentAlert = {
                id: `inc_${tick.epochMs}_${rule.id}`,
                ruleId: rule.id,
                title: `${rule.name} (${rawValue}${rule.unit} ${rule.operator} ${rule.threshold}${rule.unit})`,
                severity: rule.severity,
                status: 'FIRING',
                serviceNode: rule.targetService,
                observedValue: `${rawValue}${rule.unit}`,
                thresholdValue: `${rule.threshold}${rule.unit}`,
                rootCauseTraceId: `trc_${Math.random().toString(16).substring(2, 10)}`,
                endpointPath:
                  rule.metricKey === 'errorRatePct' ? '/api/v1/auth/token' : '/api/v1/orders',
                remediationPlaybook: rule.remediationPlaybook,
                triggeredAt: tick.timestamp
              };
              updated = [newIncident, ...updated].slice(0, 25);
            }
          }
        }
        return updated;
      });
    },
    []
  );

  // Real-time 1,000ms telemetry stream loop
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      const nextTick = generateTelemetryTick(activeScenario, Date.now());
      setTelemetryHistory((prev) => [...prev.slice(-29), nextTick]);
      evaluateRulesAgainstTick(nextTick, alertRules);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming, activeScenario, alertRules, evaluateRulesAgainstTick]);

  const handleSelectScenario = (scenarioId: ChaosScenarioId) => {
    setActiveScenario(scenarioId);
    const immediateTick = generateTelemetryTick(scenarioId, Date.now());
    setTelemetryHistory((prev) => [...prev.slice(-29), immediateTick]);
    evaluateRulesAgainstTick(immediateTick, alertRules);
  };

  const handleAcknowledgeIncident = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: 'ACKNOWLEDGED' } : inc))
    );
  };

  const handleRemediateIncident = (incidentId: string) => {
    const target = incidents.find((i) => i.id === incidentId);
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.status !== 'RESOLVED'
          ? {
              ...inc,
              status: 'RESOLVED',
              resolvedAt: formatTimeHMS(new Date())
            }
          : inc
      )
    );
    setActiveScenario('nominal');
    const nominalTick = generateTelemetryTick('nominal', Date.now());
    setTelemetryHistory((prev) => [...prev.slice(-29), nominalTick]);

    if (target) {
      setAuditLogs((prev) => [
        {
          id: `aud_${Date.now()}`,
          timestamp: `${formatTimeHMS(new Date())}.042`,
          actor: 'sre-auto-remediator@kortex.io',
          role: 'SRE_ADMIN',
          action: 'INCIDENT_AUTO_REMEDIATED',
          targetResource: `${target.serviceNode} (${target.ruleId})`,
          outcome: 'ALLOWED',
          latencyMicros: 420
        },
        ...prev
      ]);
    }
  };

  const handleResolveAllIncidents = () => {
    setIncidents((prev) =>
      prev.map((inc) => ({
        ...inc,
        status: 'RESOLVED',
        resolvedAt: formatTimeHMS(new Date())
      }))
    );
    setActiveScenario('nominal');
  };

  const handleToggleAlertRule = (ruleId: string) => {
    setAlertRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleAddAlertRule = (newRule: Omit<AlertRule, 'id'>) => {
    setAlertRules((prev) => [
      {
        ...newRule,
        id: `rule_${Date.now()}`
      },
      ...prev
    ]);
  };

  // Record request trace from Coroutine Playground
  const handleRecordRequestTrace = (routePath: string, latencyMicros: number, isError: boolean) => {
    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        timestamp: `${formatTimeHMS(new Date())}.118`,
        actor: 'playground-caller@kortex.io',
        role: isError ? 'UNAUTHORIZED_OR_INVALID' : 'SRE_ADMIN',
        action: `COROUTINE_DISPATCH ${routePath}`,
        targetResource: routePath,
        outcome: isError ? 'DENIED' : 'ALLOWED',
        latencyMicros
      },
      ...prev
    ]);
  };

  // ORM Schema Evolution & Migrations handlers
  const handleAddColumnAndGenerateMigration = (
    modelId: string,
    column: OrmColumn,
    migrationName: string
  ) => {
    const targetModel = ormModels.find((m) => m.id === modelId);
    if (!targetModel) return;

    const kotlinBuilderLine = `    val ${column.name} = ${
      column.sqlType === 'INTEGER'
        ? `integer("${column.name}", defaultExpr = "0")`
        : column.sqlType === 'BOOLEAN'
        ? `bool("${column.name}", defaultExpr = "false")`
        : column.sqlType === 'TIMESTAMPTZ'
        ? `timestampTz("${column.name}", defaultExpr = "NOW()")`
        : `varchar("${column.name}", 255)`
    }${column.indexed ? `.index("idx_${targetModel.tableName}_${column.name}")` : ''}`;

    setOrmModels((prev) =>
      prev.map((m) => {
        if (m.id !== modelId) return m;
        const updatedCode = m.kotlinCode.replace(/\}$/, `${kotlinBuilderLine}\n}`);
        return {
          ...m,
          columns: [...m.columns, column],
          kotlinCode: updatedCode
        };
      })
    );

    const upSql = `ALTER TABLE ${targetModel.tableName} ADD COLUMN ${column.name} ${column.sqlType}${
      column.nullable ? '' : ' NOT NULL'
    }${column.defaultVal ? ` DEFAULT ${column.defaultVal}` : ''};${
      column.indexed
        ? `\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${targetModel.tableName}_${column.name} ON ${targetModel.tableName} (${column.name});`
        : ''
    }`;

    const downSql = `${
      column.indexed ? `DROP INDEX IF EXISTS idx_${targetModel.tableName}_${column.name};\n` : ''
    }ALTER TABLE ${targetModel.tableName} DROP COLUMN IF EXISTS ${column.name};`;

    const newMig: MigrationRecord = {
      id: `mig_${Date.now()}`,
      version: String(migrations.length + 1).padStart(4, '0'),
      name: migrationName,
      modelName: targetModel.className,
      status: 'PENDING',
      appliedAt: 'Pending Execution',
      executionTimeMs: 0,
      upSql,
      downSql,
      checksum: `sha256:${Math.random().toString(16).substring(2, 14)}`
    };

    setMigrations((prev) => [...prev, newMig]);
  };

  const handleApplyMigration = (migrationId: string) => {
    setMigrations((prev) =>
      prev.map((m) =>
        m.id === migrationId
          ? {
              ...m,
              status: 'APPLIED',
              appliedAt: `${formatTimeHMS(new Date())} UTC`,
              executionTimeMs: 12
            }
          : m
      )
    );
    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        timestamp: `${formatTimeHMS(new Date())}.501`,
        actor: 'elena.rostova@kortex.io',
        role: 'SRE_ADMIN',
        action: 'KORTEX_MIGRATE_APPLIED',
        targetResource: migrationId,
        outcome: 'ALLOWED',
        latencyMicros: 12000
      },
      ...prev
    ]);
  };

  const handleRollbackMigration = (migrationId: string) => {
    setMigrations((prev) =>
      prev.map((m) =>
        m.id === migrationId
          ? {
              ...m,
              status: 'ROLLED_BACK',
              appliedAt: `Rolled back at ${formatTimeHMS(new Date())}`
            }
          : m
      )
    );
  };

  // Auto-Admin handlers
  const handleToggleUserStatus = (userId: string) => {
    setAdminUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : u
      )
    );
  };

  const handleCreateAdminUser = (
    email: string,
    fullName: string,
    role: AdminUserRecord['role']
  ) => {
    const newUser: AdminUserRecord = {
      id: `usr_${Math.random().toString(16).substring(2, 6)}`,
      email,
      fullName,
      role,
      status: 'ACTIVE',
      mfaEnabled: true,
      lastLogin: 'Just now',
      passwordHashAlgorithm: 'Argon2id (m=65536, t=3, p=4)'
    };
    setAdminUsers((prev) => [newUser, ...prev]);
    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        timestamp: `${formatTimeHMS(new Date())}.210`,
        actor: 'elena.rostova@kortex.io',
        role: 'SRE_ADMIN',
        action: 'ADMIN_USER_CREATED',
        targetResource: email,
        outcome: 'ALLOWED',
        latencyMicros: 610
      },
      ...prev
    ]);
  };

  const handleUpdateOrderStatus = (orderId: string, status: AdminOrderRecord['status']) => {
    setAdminOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handleSimulateRbacCheck = (
    role: AdminUserRecord['role'],
    permission: string,
    resource: string
  ) => {
    const rolePermissions: Record<AdminUserRecord['role'], string[]> = {
      SRE_ADMIN: ['users:read', 'users:write', 'orders:write', 'migrations:apply', 'alerts:manage'],
      BACKEND_DEV: ['users:read', 'orders:write', 'telemetry:view'],
      SECURITY_AUDITOR: ['users:read', 'telemetry:view', 'audit:read'],
      SERVICE_ACCOUNT: ['orders:write', 'telemetry:view']
    };
    const allowed = rolePermissions[role].includes(permission);
    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        timestamp: `${formatTimeHMS(new Date())}.074`,
        actor: `simulator-${role.toLowerCase()}@kortex.io`,
        role,
        action: `RBAC_CHECK [${permission}]`,
        targetResource: resource,
        outcome: allowed ? 'ALLOWED' : 'DENIED',
        latencyMicros: 74
      },
      ...prev
    ]);
  };

  const latestPoint = telemetryHistory[telemetryHistory.length - 1];
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] flex flex-col">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-[#1E293B] bg-[#0B0F17] sticky top-0 z-30">
        {/* Zone 1: Single Text Element Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('telemetry');
          }}
          className="text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0"
        >
          Kortex
        </a>

        {/* Zone 2: 5 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'telemetry'
                ? 'text-slate-50 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Telemetry & Alerting
          </button>
          <button
            onClick={() => setActiveTab('dsl')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'dsl'
                ? 'text-slate-50 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Coroutine DSL
          </button>
          <button
            onClick={() => setActiveTab('orm')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'orm'
                ? 'text-slate-50 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            ORM & Migrations
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'admin'
                ? 'text-slate-50 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Auto-Admin
          </button>
          <button
            onClick={() => setActiveTab('cli_roadmap')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'cli_roadmap'
                ? 'text-slate-50 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            CLI & Roadmap
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setActiveTab('telemetry');
              handleSelectScenario(
                activeScenario === 'nominal' ? 'traffic_spike' : 'nominal'
              );
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeScenario === 'nominal' ? 'Simulate Traffic Spike' : 'Restore Nominal SLA'}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout: Left Context Sidebar (260px) + Main Content Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Navigation & Runtime Context Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#0B0F17] p-5 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Framework Identity Summary */}
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-indigo-400">Pure Kotlin 2.1 Framework</div>
              <div className="text-sm font-semibold text-slate-100">
                FastAPI Speed + Django Batteries
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Non-blocking coroutines, KortexORM migrations, RBAC Auto-Admin, CLI scaffolder, and live SRE anomaly alerting.
              </p>
            </div>

            {/* Sidebar Workspace Switcher */}
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-slate-400 pb-1">Workspace Modules</div>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'telemetry'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Activity className="w-3.5 h-3.5" />
                  Live Telemetry & Alerts
                </span>
                <span className="font-mono text-[11px] tabular-nums">
                  {activeIncidentsCount > 0 ? `${activeIncidentsCount} ALERT` : 'OK'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('dsl')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'dsl'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Code2 className="w-3.5 h-3.5" />
                  Coroutine Routing DSL
                </span>
                <span className="font-mono text-[11px]">4 Routes</span>
              </button>

              <button
                onClick={() => setActiveTab('orm')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'orm'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Database className="w-3.5 h-3.5" />
                  KortexORM & Migrations
                </span>
                <span className="font-mono text-[11px] tabular-nums">v000{migrations.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Auto-Admin & Security
                </span>
                <span className="font-mono text-[11px]">RBAC</span>
              </button>

              <button
                onClick={() => setActiveTab('cli_roadmap')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'cli_roadmap'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Terminal className="w-3.5 h-3.5" />
                  CLI & Roadmap/Phases
                </span>
                <span className="font-mono text-[11px]">5 Phases</span>
              </button>
            </div>

            {/* Live Node Snapshot in Sidebar */}
            <div className="pt-4 border-t border-[#1E293B] space-y-2.5 text-xs font-mono">
              <div className="text-slate-400">Active Runtime Metrics</div>
              <div className="flex items-center justify-between text-slate-300">
                <span>p99 Latency</span>
                <span
                  className={`tabular-nums ${
                    latestPoint.p99Ms > 12 ? 'text-red-400 font-semibold' : 'text-emerald-400'
                  }`}
                >
                  {latestPoint.p99Ms.toFixed(2)} ms
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Throughput</span>
                <span className="tabular-nums text-slate-100">
                  {latestPoint.rps.toLocaleString()} rps
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Active Fibers</span>
                <span className="tabular-nums text-slate-100">
                  {latestPoint.activeCoroutines.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>R2DBC Wait</span>
                <span
                  className={`tabular-nums ${
                    latestPoint.dbPoolWait >= 10 ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  {latestPoint.dbPoolWait} conns
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E293B] text-[11px] font-mono text-slate-400 space-y-1">
            <div>Docs: ROADMAP.md · PHASES.md</div>
            <div>Source: /kotlin-framework/*.kt</div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto">
          {activeTab === 'telemetry' && (
            <TelemetryAlertingView
              history={telemetryHistory}
              latestPoint={latestPoint}
              activeScenario={activeScenario}
              onSelectScenario={handleSelectScenario}
              isStreaming={isStreaming}
              onToggleStream={() => setIsStreaming(!isStreaming)}
              alertRules={alertRules}
              onToggleRule={handleToggleAlertRule}
              onAddRule={handleAddAlertRule}
              incidents={incidents}
              onAcknowledgeIncident={handleAcknowledgeIncident}
              onRemediateIncident={handleRemediateIncident}
              onResolveAllIncidents={handleResolveAllIncidents}
            />
          )}

          {activeTab === 'dsl' && (
            <CoroutineDslPlayground onRecordRequestTrace={handleRecordRequestTrace} />
          )}

          {activeTab === 'orm' && (
            <OrmMigrationStudio
              models={ormModels}
              migrations={migrations}
              onAddColumnAndGenerateMigration={handleAddColumnAndGenerateMigration}
              onApplyMigration={handleApplyMigration}
              onRollbackMigration={handleRollbackMigration}
            />
          )}

          {activeTab === 'admin' && (
            <AutoAdminPortal
              users={adminUsers}
              orders={adminOrders}
              auditLogs={auditLogs}
              onToggleUserStatus={handleToggleUserStatus}
              onCreateAdminUser={handleCreateAdminUser}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onSimulateRbacCheck={handleSimulateRbacCheck}
            />
          )}

          {activeTab === 'cli_roadmap' && <CliAndRoadmapStudio initialSection="roadmap" />}
        </main>
      </div>
    </div>
  );
}
