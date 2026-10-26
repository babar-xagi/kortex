import React, { useState } from 'react';
import { Play, Code2, FileJson, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { KOTLIN_ROUTES, KotlinRouteSpec, CoroutineSpan } from '../data/kortexData';

interface CoroutineDslPlaygroundProps {
  onRecordRequestTrace: (routePath: string, latencyMicros: number, isError: boolean) => void;
}

export const CoroutineDslPlayground: React.FC<CoroutineDslPlaygroundProps> = ({
  onRecordRequestTrace
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(KOTLIN_ROUTES[0].id);
  const [codeTab, setCodeTab] = useState<'dsl' | 'schemas' | 'openapi'>('dsl');
  const [requestBodyText, setRequestBodyText] = useState<string>(KOTLIN_ROUTES[0].sampleRequestJson);
  const [simulatedRole, setSimulatedRole] = useState<'SRE_ADMIN' | 'BACKEND_DEV' | 'ANONYMOUS_GUEST'>('SRE_ADMIN');
  const [executionResult, setExecutionResult] = useState<{
    status: number;
    durationMicros: number;
    responseJson: string;
    spans: CoroutineSpan[];
    traceId: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const selectedRoute: KotlinRouteSpec =
    KOTLIN_ROUTES.find((r) => r.id === selectedRouteId) || KOTLIN_ROUTES[0];

  const handleSelectRoute = (route: KotlinRouteSpec) => {
    setSelectedRouteId(route.id);
    setRequestBodyText(route.sampleRequestJson);
    setExecutionResult(null);
  };

  const handleCopyCode = () => {
    const content =
      codeTab === 'dsl'
        ? selectedRoute.kotlinDslCode
        : codeTab === 'schemas'
        ? `${selectedRoute.requestSchemaKotlin}\n\n${selectedRoute.responseSchemaKotlin}`
        : selectedRoute.openApiSpecJson;
    navigator.clipboard.writeText(content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleExecuteRequest = () => {
    const traceId = `trc_${Math.random().toString(16).substring(2, 10)}`;

    // 1. Check Auth Guard
    if (simulatedRole === 'ANONYMOUS_GUEST' && selectedRoute.requiredPermission !== 'public') {
      const errJson = JSON.stringify(
        {
          error: 'KortexUnauthorizedException',
          status: 401,
          message: `Missing or invalid Ed25519 JWT for guard ${selectedRoute.authGuard}`,
          requiredPermission: selectedRoute.requiredPermission,
          traceId
        },
        null,
        2
      );
      setExecutionResult({
        status: 401,
        durationMicros: 95,
        responseJson: errJson,
        traceId,
        spans: [
          {
            spanName: 'NettyNioCoroutineAccept',
            dispatcher: 'kortex-io-worker-2',
            durationMicros: 32,
            status: 'OK',
            detail: 'Decoded HTTP request headers'
          },
          {
            spanName: 'Ed25519JwtGuard.verify',
            dispatcher: 'kortex-io-worker-2',
            durationMicros: 63,
            status: 'ERR',
            detail: `Rejected: role ANONYMOUS_GUEST lacks permission '${selectedRoute.requiredPermission}'`
          }
        ]
      });
      onRecordRequestTrace(selectedRoute.path, 95, true);
      return;
    }

    // 2. Validate JSON Syntax & Schema Constraints (FastAPI-style 422 diagnostics)
    try {
      const parsed = JSON.parse(requestBodyText);
      if (selectedRoute.id === 'route_create_order') {
        if (!parsed.customerEmail || !String(parsed.customerEmail).includes('@')) {
          throw new Error('Field "customerEmail" failed @Email validation constraint');
        }
        if (typeof parsed.amountUsd !== 'number' || parsed.amountUsd <= 0) {
          throw new Error('Field "amountUsd" failed @Positive constraint (must be > 0)');
        }
      }
    } catch (err: any) {
      const errJson = JSON.stringify(
        {
          error: 'KortexSchemaValidationException',
          status: 422,
          detail: err?.message || 'Malformed JSON body',
          validator: 'kotlinx.serializationCompileTimeDescriptor',
          traceId
        },
        null,
        2
      );
      setExecutionResult({
        status: 422,
        durationMicros: 118,
        responseJson: errJson,
        traceId,
        spans: [
          {
            spanName: 'NettyNioCoroutineAccept',
            dispatcher: 'kortex-io-worker-1',
            durationMicros: 35,
            status: 'OK',
            detail: 'Accepted non-blocking frame'
          },
          {
            spanName: 'Ed25519JwtGuard.verify',
            dispatcher: 'kortex-io-worker-1',
            durationMicros: 48,
            status: 'OK',
            detail: `Authenticated role=${simulatedRole}`
          },
          {
            spanName: 'KotlinxSchemaValidator.decode',
            dispatcher: 'kortex-io-worker-1',
            durationMicros: 35,
            status: 'ERR',
            detail: err?.message || 'Schema validation failed'
          }
        ]
      });
      onRecordRequestTrace(selectedRoute.path, 118, true);
      return;
    }

    // 3. Nominal Sub-Millisecond Execution
    const jitter = Math.floor(Math.random() * 60) - 25;
    const totalMicros = Math.max(140, selectedRoute.avgLatencyMicros + jitter);
    let parsedSample = JSON.parse(selectedRoute.sampleResponseJson);
    parsedSample = {
      ...parsedSample,
      traceId,
      executionTimeMicros: totalMicros
    };

    setExecutionResult({
      status: selectedRoute.method === 'POST' ? 201 : 200,
      durationMicros: totalMicros,
      responseJson: JSON.stringify(parsedSample, null, 2),
      traceId,
      spans: selectedRoute.executionSpans
    });
    onRecordRequestTrace(selectedRoute.path, totalMicros, false);
  };

  return (
    <div className="space-y-6">
      {/* Top Route Selector Bar */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              01. Pure Kotlin Coroutine Routing DSL & Automatic OpenAPI 3.1 Synthesis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              FastAPI ergonomics in pure Kotlin: generic <span className="font-mono text-slate-200">post&lt;Req, Res&gt;</span> builders, compile-time <span className="font-mono text-slate-200">kotlinx.serialization</span> validation, and zero thread blocking
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Engine: Netty + Coroutines 1.9</span>
            <span aria-hidden="true">·</span>
            <span>Reflection: Zero (KSP)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {KOTLIN_ROUTES.map((route) => {
            const isSelected = route.id === selectedRoute.id;
            return (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route)}
                className={`text-left p-3.5 rounded-md border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/70'
                    : 'bg-[#0B0F17] border-[#1E293B] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span
                    className={
                      route.method === 'POST'
                        ? 'text-emerald-400 font-semibold'
                        : 'text-sky-400 font-semibold'
                    }
                  >
                    {route.method}
                  </span>
                  <span className="text-slate-400 tabular-nums">{route.avgLatencyMicros} µs avg</span>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-100 mt-1 truncate">
                  {route.path}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{route.summary}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Kotlin DSL / Schema Inspector (Left 7) + Non-Blocking Request Simulator & Waterfall (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Cols: Kotlin DSL Code & OpenAPI Contract */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-lg flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-md">
                <button
                  onClick={() => setCodeTab('dsl')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    codeTab === 'dsl'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Coroutine Route DSL (.kt)
                </button>
                <button
                  onClick={() => setCodeTab('schemas')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    codeTab === 'schemas'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  @Serializable Schemas (.kt)
                </button>
                <button
                  onClick={() => setCodeTab('openapi')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    codeTab === 'openapi'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Auto-OpenAPI 3.1 Spec
                </button>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 text-xs font-mono bg-[#0B0F17] hover:bg-slate-800 text-slate-300 border border-[#1E293B] rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Source
                  </>
                )}
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 mb-3">
                <span>Guard: {selectedRoute.authGuard}</span>
                <span aria-hidden="true">·</span>
                <span>Scope: {selectedRoute.requiredPermission}</span>
                <span aria-hidden="true">·</span>
                <span>Benchmark: {selectedRoute.throughputRps.toLocaleString()} req/s</span>
              </div>

              <pre className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-md text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                <code>
                  {codeTab === 'dsl'
                    ? selectedRoute.kotlinDslCode
                    : codeTab === 'schemas'
                    ? `${selectedRoute.requestSchemaKotlin}\n\n${selectedRoute.responseSchemaKotlin}`
                    : selectedRoute.openApiSpecJson}
                </code>
              </pre>
            </div>
          </div>

          <div className="px-5 py-3.5 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Zero-boilerplate validation: invalid payloads automatically return HTTP 422 before hitting KortexORM</span>
            <span className="font-mono text-indigo-400">io.kortex.core.KortexRouter</span>
          </div>
        </div>

        {/* Right 5 Cols: Interactive Coroutine Request Executor & Span Waterfall */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-lg flex flex-col justify-between">
          <div className="p-5 border-b border-[#1E293B]">
            <h3 className="text-base font-semibold text-slate-100">
              02. Interactive Coroutine Request & Trace Debugger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Test schema validation, RBAC guards, and inspect sub-millisecond continuation spans
            </p>
          </div>

          <div className="p-5 space-y-4 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-300">Simulated Caller JWT Role</label>
              <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-md">
                {(['SRE_ADMIN', 'BACKEND_DEV', 'ANONYMOUS_GUEST'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSimulatedRole(r)}
                    className={`px-2 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                      simulatedRole === r
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Request Payload / Query JSON
                </label>
                <button
                  onClick={() =>
                    setRequestBodyText(
                      JSON.stringify({ customerEmail: 'invalid-email', amountUsd: -50 }, null, 2)
                    )
                  }
                  className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
                >
                  Load Invalid Payload (Test 422)
                </button>
              </div>
              <textarea
                rows={6}
                value={requestBodyText}
                onChange={(e) => setRequestBodyText(e.target.value)}
                className="w-full p-3 bg-[#0B0F17] border border-[#1E293B] rounded-md text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleExecuteRequest}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Execute Non-Blocking Coroutine Request ({selectedRoute.method} {selectedRoute.path})
            </button>

            {/* Execution Output & Span Waterfall */}
            {executionResult && (
              <div className="space-y-3 pt-2 border-t border-[#1E293B]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={
                      executionResult.status >= 400
                        ? 'text-red-400 font-semibold'
                        : 'text-emerald-400 font-semibold'
                    }
                  >
                    HTTP {executionResult.status}{' '}
                    {executionResult.status === 200 || executionResult.status === 201
                      ? 'OK'
                      : executionResult.status === 401
                      ? 'UNAUTHORIZED'
                      : 'UNPROCESSABLE_ENTITY'}
                  </span>
                  <span className="text-slate-300 tabular-nums">
                    Total Elapsed: {executionResult.durationMicros} µs ({(executionResult.durationMicros / 1000).toFixed(2)} ms)
                  </span>
                </div>

                {/* Coroutine Continuation Span Waterfall */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-slate-400">
                    Coroutine Execution Waterfall ({executionResult.traceId}):
                  </div>
                  <div className="divide-y divide-[#1E293B] border border-[#1E293B] rounded bg-[#0B0F17]">
                    {executionResult.spans.map((span, idx) => (
                      <div key={idx} className="p-2.5 text-xs">
                        <div className="flex items-center justify-between font-mono">
                          <span
                            className={
                              span.status === 'ERR' ? 'text-red-400 font-semibold' : 'text-slate-200'
                            }
                          >
                            {idx + 1}. {span.spanName}
                          </span>
                          <span className="text-indigo-400 tabular-nums">{span.durationMicros} µs</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                          <span>{span.detail}</span>
                          <span className="font-mono text-slate-500">{span.dispatcher}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <pre className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded text-xs font-mono text-slate-300 overflow-x-auto max-h-40">
                  <code>{executionResult.responseJson}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
