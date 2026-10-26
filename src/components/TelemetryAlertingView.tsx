import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  Sliders,
  ShieldAlert,
  Zap,
  RefreshCw,
  Plus,
  Terminal
} from 'lucide-react';
import {
  TelemetryPoint,
  ChaosScenario,
  ChaosScenarioId,
  AlertRule,
  IncidentAlert,
  CHAOS_SCENARIOS
} from '../data/kortexData';

interface TelemetryAlertingViewProps {
  history: TelemetryPoint[];
  latestPoint: TelemetryPoint;
  activeScenario: ChaosScenarioId;
  onSelectScenario: (id: ChaosScenarioId) => void;
  isStreaming: boolean;
  onToggleStream: () => void;
  alertRules: AlertRule[];
  onToggleRule: (ruleId: string) => void;
  onAddRule: (rule: Omit<AlertRule, 'id'>) => void;
  incidents: IncidentAlert[];
  onAcknowledgeIncident: (incidentId: string) => void;
  onRemediateIncident: (incidentId: string) => void;
  onResolveAllIncidents: () => void;
}

export const TelemetryAlertingView: React.FC<TelemetryAlertingViewProps> = ({
  history,
  latestPoint,
  activeScenario,
  onSelectScenario,
  isStreaming,
  onToggleStream,
  alertRules,
  onToggleRule,
  onAddRule,
  incidents,
  onAcknowledgeIncident,
  onRemediateIncident,
  onResolveAllIncidents
}) => {
  const [chartMetric, setChartMetric] = useState<'latency' | 'throughput' | 'coroutines'>('latency');
  const [incidentFilter, setIncidentFilter] = useState<'ALL' | 'FIRING' | 'RESOLVED'>('ALL');
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleMetric, setNewRuleMetric] = useState<AlertRule['metricKey']>('p99Ms');
  const [newRuleThreshold, setNewRuleThreshold] = useState('15');
  const [newRuleSeverity, setNewRuleSeverity] = useState<'CRITICAL' | 'WARNING'>('CRITICAL');
  const [newRulePlaybook, setNewRulePlaybook] = useState('Auto-Scale Coroutine Dispatcher & Flush R2DBC Queue');

  const firingIncidents = incidents.filter((i) => i.status === 'FIRING' || i.status === 'ACKNOWLEDGED');
  const filteredIncidents = incidents.filter((inc) => {
    if (incidentFilter === 'ALL') return true;
    if (incidentFilter === 'FIRING') return inc.status === 'FIRING' || inc.status === 'ACKNOWLEDGED';
    return inc.status === 'RESOLVED';
  });

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    const metricMeta: Record<AlertRule['metricKey'], { label: string; unit: string }> = {
      p99Ms: { label: 'p99 Latency', unit: 'ms' },
      errorRatePct: { label: 'Error Rate', unit: '%' },
      dbPoolWait: { label: 'DB Pool Wait Queue', unit: 'conns' },
      activeCoroutines: { label: 'Active Coroutines', unit: 'coroutines' },
      rps: { label: 'Ingress Throughput', unit: 'rps' }
    };
    onAddRule({
      name: newRuleName.trim(),
      metricKey: newRuleMetric,
      metricLabel: metricMeta[newRuleMetric].label,
      operator: '>',
      threshold: parseFloat(newRuleThreshold) || 10,
      unit: metricMeta[newRuleMetric].unit,
      severity: newRuleSeverity,
      enabled: true,
      remediationPlaybook: newRulePlaybook.trim() || 'Scale Coroutine Workers',
      targetService: 'kortex-cluster-global'
    });
    setNewRuleName('');
    setShowNewRuleForm(false);
  };

  // SVG Chart coordinate calculation
  const chartWidth = 820;
  const chartHeight = 230;
  const padLeft = 48;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 28;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const maxVal =
    chartMetric === 'latency'
      ? Math.max(25, ...history.map((h) => h.p99Ms * 1.15))
      : chartMetric === 'throughput'
      ? Math.max(45000, ...history.map((h) => h.rps * 1.1))
      : Math.max(5000, ...history.map((h) => (h.activeCoroutines + h.suspendedContinuations) * 1.1));

  const buildPolyline = (selector: (pt: TelemetryPoint) => number) => {
    if (history.length === 0) return '';
    return history
      .map((pt, idx) => {
        const x = padLeft + (idx / Math.max(1, history.length - 1)) * plotW;
        const val = selector(pt);
        const y = padTop + plotH - Math.min(1, Math.max(0, val / maxVal)) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const currentScenarioObj: ChaosScenario =
    CHAOS_SCENARIOS.find((s) => s.id === activeScenario) || CHAOS_SCENARIOS[0];

  return (
    <div className="space-y-6">
      {/* Active Critical Anomaly Alert Banner */}
      {firingIncidents.length > 0 && (
        <div className="bg-[#111827] border border-red-500/60 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ACTIVE ANOMALY DETECTED</span>
              <span aria-hidden="true">·</span>
              <span>{firingIncidents.length} Critical/Warning Incident(s) Firing</span>
              <span aria-hidden="true">·</span>
              <span>Scenario: {currentScenarioObj.label}</span>
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              {firingIncidents[0].title} on {firingIncidents[0].serviceNode}
            </h2>
            <p className="text-xs text-slate-400">
              Observed <span className="font-mono text-slate-200">{firingIncidents[0].observedValue}</span>{' '}
              (Threshold: <span className="font-mono text-slate-300">{firingIncidents[0].thresholdValue}</span>) ·
              Root-Cause Trace <span className="font-mono text-indigo-400">{firingIncidents[0].rootCauseTraceId}</span> ·
              Recommended Runbook: <span className="text-slate-200">{firingIncidents[0].remediationPlaybook}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onRemediateIncident(firingIncidents[0].id)}
              className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Execute Auto-Remediation
            </button>
            <button
              onClick={onResolveAllIncidents}
              className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reset to Nominal Baseline
            </button>
          </div>
        </div>
      )}

      {/* Top 4-Column Telemetry Strip */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1E293B]">
        {/* Metric 1: Latency Percentiles */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Coroutine Request Latency</span>
            <span className="font-mono text-slate-300">
              {latestPoint.p99Ms > 12 ? 'SLA BREACH' : 'NOMINAL'}
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                latestPoint.p99Ms > 12 ? 'text-red-400' : 'text-slate-50'
              }`}
            >
              {latestPoint.p99Ms.toFixed(2)} ms
            </span>
            <span className="text-xs font-mono text-slate-400">p99</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
            <span>p50: {latestPoint.p50Ms.toFixed(2)}ms</span>
            <span aria-hidden="true">·</span>
            <span>p95: {latestPoint.p95Ms.toFixed(2)}ms</span>
          </div>
        </div>

        {/* Metric 2: Non-Blocking Throughput */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Non-Blocking Throughput</span>
            <span className="font-mono text-emerald-400">HTTP/2 + Coroutines</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-50">
              {latestPoint.rps.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">req/sec</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
            <span>CPU: {latestPoint.cpuPct}%</span>
            <span aria-hidden="true">·</span>
            <span>Heap: {latestPoint.heapMb} MB</span>
          </div>
        </div>

        {/* Metric 3: Coroutine Continuation Pool */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Coroutine Fibers</span>
            <span className="font-mono text-slate-300">16 Carrier Threads</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                latestPoint.activeCoroutines > 3500 ? 'text-amber-400' : 'text-slate-50'
              }`}
            >
              {latestPoint.activeCoroutines.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">active</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
            <span>Suspended: {latestPoint.suspendedContinuations.toLocaleString()}</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Blocking I/O</span>
          </div>
        </div>

        {/* Metric 4: R2DBC Connection Pool & Error Rate */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>R2DBC Pool & Error SLA</span>
            <span
              className={`font-mono ${
                latestPoint.errorRatePct > 1.5 || latestPoint.dbPoolWait >= 10
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {latestPoint.errorRatePct > 1.5 ? 'DEGRADED' : 'HEALTHY'}
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                latestPoint.errorRatePct > 1.5 ? 'text-red-400' : 'text-slate-50'
              }`}
            >
              {latestPoint.errorRatePct.toFixed(2)}%
            </span>
            <span className="text-xs font-mono text-slate-400">error rate</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
            <span>DB Active: {latestPoint.dbPoolActive}/64</span>
            <span aria-hidden="true">·</span>
            <span>Wait Queue: {latestPoint.dbPoolWait}</span>
          </div>
        </div>
      </div>

      {/* Main Split: Live Telemetry Stream Chart + Chaos & Load Injection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 Cols: Real-Time Telemetry Visualizer */}
        <div className="lg:col-span-8 bg-[#111827] border border-[#1E293B] rounded-lg flex flex-col justify-between">
          <div className="p-5 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                01. Real-Time Coroutine & Microservice Telemetry Stream
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Lock-free HDR histogram sampling every 1,000ms · Sub-15µs probe overhead
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Interactive Chart Mode Selector */}
              <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-md">
                <button
                  onClick={() => setChartMetric('latency')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    chartMetric === 'latency'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Latency (p50/p95/p99)
                </button>
                <button
                  onClick={() => setChartMetric('throughput')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    chartMetric === 'throughput'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Throughput (RPS)
                </button>
                <button
                  onClick={() => setChartMetric('coroutines')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    chartMetric === 'coroutines'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Coroutines
                </button>
              </div>

              <button
                onClick={onToggleStream}
                className="px-3 py-1.5 text-xs font-medium bg-[#0B0F17] hover:bg-slate-800 text-slate-200 border border-[#1E293B] rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isStreaming ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    Pause Stream
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    Resume Stream
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SVG Chart Body */}
          <div className="p-5">
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-56 bg-[#0B0F17] border border-[#1E293B] rounded"
              >
                {/* Horizontal Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padTop + ratio * plotH;
                  const labelVal = ((1 - ratio) * maxVal).toFixed(chartMetric === 'latency' ? 1 : 0);
                  return (
                    <g key={idx}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={chartWidth - padRight}
                        y2={y}
                        stroke="#1E293B"
                        strokeDasharray={ratio === 1 ? undefined : '3 3'}
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-500 text-[10px] font-mono"
                      >
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* SLA Threshold Line for Latency */}
                {chartMetric === 'latency' && 12.0 <= maxVal && (
                  <g>
                    <line
                      x1={padLeft}
                      y1={padTop + plotH - (12.0 / maxVal) * plotH}
                      x2={chartWidth - padRight}
                      y2={padTop + plotH - (12.0 / maxVal) * plotH}
                      stroke="#EF4444"
                      strokeDasharray="4 4"
                      strokeWidth="1.2"
                    />
                    <text
                      x={chartWidth - padRight - 6}
                      y={padTop + plotH - (12.0 / maxVal) * plotH - 5}
                      textAnchor="end"
                      className="fill-red-400 text-[10px] font-mono"
                    >
                      SLA p99 Threshold (12.0ms)
                    </text>
                  </g>
                )}

                {/* Chart Polylines */}
                {chartMetric === 'latency' && (
                  <>
                    <polyline
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2"
                      points={buildPolyline((pt) => pt.p99Ms)}
                    />
                    <polyline
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.75"
                      points={buildPolyline((pt) => pt.p95Ms)}
                    />
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      points={buildPolyline((pt) => pt.p50Ms)}
                    />
                  </>
                )}

                {chartMetric === 'throughput' && (
                  <polyline
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2.25"
                    points={buildPolyline((pt) => pt.rps)}
                  />
                )}

                {chartMetric === 'coroutines' && (
                  <>
                    <polyline
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      points={buildPolyline((pt) => pt.activeCoroutines)}
                    />
                    <polyline
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="1.75"
                      points={buildPolyline((pt) => pt.suspendedContinuations)}
                    />
                  </>
                )}
              </svg>
            </div>

            {/* Chart Legend & Live Stream Metadata */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono">
              {chartMetric === 'latency' && (
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400">p50: {latestPoint.p50Ms.toFixed(2)}ms</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400">p95: {latestPoint.p95Ms.toFixed(2)}ms</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-red-400">p99: {latestPoint.p99Ms.toFixed(2)}ms</span>
                </div>
              )}
              {chartMetric === 'throughput' && (
                <div className="flex items-center gap-4">
                  <span className="text-indigo-400">Ingress RPS: {latestPoint.rps.toLocaleString()} req/s</span>
                  <span aria-hidden="true">·</span>
                  <span>Worker Utilization: {latestPoint.cpuPct}%</span>
                </div>
              )}
              {chartMetric === 'coroutines' && (
                <div className="flex items-center gap-4">
                  <span className="text-violet-400">Active Fibers: {latestPoint.activeCoroutines.toLocaleString()}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-sky-400">
                    Suspended Continuations: {latestPoint.suspendedContinuations.toLocaleString()}
                  </span>
                </div>
              )}
              <span>Window: Rolling {history.length}s · Last Tick {latestPoint.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Production Chaos & Anomaly Injector */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-lg flex flex-col justify-between">
          <div className="p-5 border-b border-[#1E293B]">
            <h2 className="text-base font-semibold text-slate-100">
              02. Deployment Chaos & Traffic Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate production anomalies to test real-time alerting & DevOps runbooks
            </p>
          </div>

          <div className="divide-y divide-[#1E293B] flex-1">
            {CHAOS_SCENARIOS.map((scenario) => {
              const isSelected = activeScenario === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer block ${
                    isSelected ? 'bg-indigo-950/40' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100">{scenario.label}</span>
                    <span className="text-[11px] font-mono text-indigo-400">
                      {isSelected ? 'ACTIVE' : 'ACTIVATE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{scenario.shortDesc}</p>
                  <div className="mt-1.5 text-[11px] font-mono text-slate-300">
                    {scenario.targetMetricImpact}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Split: Automated Incident Feed + Configurable SLA Alert Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Instant Incident Response Console */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-lg">
          <div className="p-5 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                03. Automated Incident Feed & One-Click DevOps Runbooks
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Correlated coroutine trace diagnostics with automated remediation actions
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-md">
              {(['ALL', 'FIRING', 'RESOLVED'] as const).map((statusFilter) => (
                <button
                  key={statusFilter}
                  onClick={() => setIncidentFilter(statusFilter)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    incidentFilter === statusFilter
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {statusFilter === 'ALL'
                    ? `All (${incidents.length})`
                    : statusFilter === 'FIRING'
                    ? `Active (${firingIncidents.length})`
                    : `Resolved (${incidents.filter((i) => i.status === 'RESOLVED').length})`}
                </button>
              ))}
            </div>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
              <div className="text-sm font-medium text-slate-200">
                Zero Active Anomalies in Selected Filter
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All coroutine dispatchers and R2DBC connection pools are operating within nominal SLA bounds. Trigger a
                Chaos Scenario on the right to test automated anomaly detection.
              </p>
              <button
                onClick={() => onSelectScenario('traffic_spike')}
                className="px-3.5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors cursor-pointer"
              >
                Simulate 38k RPS Flash Crowd Surge
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1E293B]">
              {filteredIncidents.map((inc) => (
                <div key={inc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span
                        className={
                          inc.status === 'RESOLVED'
                            ? 'text-emerald-400'
                            : inc.severity === 'CRITICAL'
                            ? 'text-red-400 font-semibold'
                            : 'text-amber-400 font-semibold'
                        }
                      >
                        [{inc.status === 'RESOLVED' ? 'RESOLVED' : inc.severity}]
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300">{inc.serviceNode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-indigo-400">{inc.rootCauseTraceId}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-400">{inc.triggeredAt}</span>
                    </div>

                    <div className="text-sm font-semibold text-slate-100">{inc.title}</div>

                    <div className="text-xs text-slate-400">
                      Observed: <span className="font-mono text-slate-200">{inc.observedValue}</span> (SLA Limit:{' '}
                      <span className="font-mono text-slate-300">{inc.thresholdValue}</span>) · Endpoint:{' '}
                      <span className="font-mono text-slate-300">{inc.endpointPath}</span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Runbook: <span className="text-slate-300">{inc.remediationPlaybook}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {inc.status === 'FIRING' && (
                      <button
                        onClick={() => onAcknowledgeIncident(inc.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                    {inc.status !== 'RESOLVED' && (
                      <button
                        onClick={() => onRemediateIncident(inc.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Run Remediation
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Cols: SLA Anomaly Rule Engine */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-lg">
          <div className="p-5 border-b border-[#1E293B] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                04. Automated SLA Anomaly Rules
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time threshold evaluators wired to instant incident triggers
              </p>
            </div>
            <button
              onClick={() => setShowNewRuleForm(!showNewRuleForm)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {showNewRuleForm ? 'Close Form' : 'New SLA Rule'}
            </button>
          </div>

          {showNewRuleForm && (
            <form onSubmit={handleCreateRule} className="p-4 border-b border-[#1E293B] bg-[#0B0F17] space-y-3">
              <div className="text-xs font-semibold text-slate-200">Create Custom Anomaly Rule</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coroutine Queue Spike"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#111827] border border-[#1E293B] rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Target Metric</label>
                  <select
                    value={newRuleMetric}
                    onChange={(e) => setNewRuleMetric(e.target.value as AlertRule['metricKey'])}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#111827] border border-[#1E293B] rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="p99Ms">p99 Latency (ms)</option>
                    <option value="errorRatePct">Error Rate (%)</option>
                    <option value="dbPoolWait">DB Pool Wait Queue</option>
                    <option value="activeCoroutines">Active Coroutines</option>
                    <option value="rps">Throughput (RPS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Breach Threshold</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#111827] border border-[#1E293B] rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Severity Level</label>
                  <select
                    value={newRuleSeverity}
                    onChange={(e) => setNewRuleSeverity(e.target.value as 'CRITICAL' | 'WARNING')}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#111827] border border-[#1E293B] rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CRITICAL">CRITICAL (P1)</option>
                    <option value="WARNING">WARNING (P2)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Automated Remediation Playbook</label>
                <input
                  type="text"
                  value={newRulePlaybook}
                  onChange={(e) => setNewRulePlaybook(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#111827] border border-[#1E293B] rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors cursor-pointer"
                >
                  Save & Activate Rule
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#1E293B]">
            {alertRules.map((rule) => (
              <div key={rule.id} className="p-4 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className={rule.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}>
                      {rule.severity}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">
                      {rule.metricLabel} {rule.operator} {rule.threshold}
                      {rule.unit}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-100">{rule.name}</div>
                  <div className="text-xs text-slate-400">Playbook: {rule.remediationPlaybook}</div>
                </div>
                <button
                  onClick={() => onToggleRule(rule.id)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    rule.enabled
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {rule.enabled ? 'ENABLED' : 'MUTED'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
