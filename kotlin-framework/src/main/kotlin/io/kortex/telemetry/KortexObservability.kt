package io.kortex.telemetry

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlin.math.sqrt

/**
 * Kortex Real-Time DevOps Observability & Automated Anomaly Alerting Engine.
 * Tracks sub-millisecond latency percentiles, coroutine continuation health,
 * and evaluates SLA rules for instant DevOps incident triggers.
 */
data class TelemetrySnapshot(
    val timestampEpochMs: Long,
    val rps: Int,
    val p50LatencyMs: Double,
    val p95LatencyMs: Double,
    val p99LatencyMs: Double,
    val activeCoroutines: Int,
    val suspendedContinuations: Int,
    val dbPoolActive: Int,
    val dbPoolWaitQueue: Int,
    val errorRatePct: Double
)

enum class AlertSeverity { CRITICAL, WARNING, INFO }

data class AnomalyRule(
    val id: String,
    val name: String,
    val metricName: String,
    val threshold: Double,
    val severity: AlertSeverity,
    val remediationPlaybook: String
)

data class AnomalyIncident(
    val id: String,
    val ruleId: String,
    val title: String,
    val severity: AlertSeverity,
    val observedValue: Double,
    val thresholdValue: Double,
    val remediationPlaybook: String,
    val triggeredAtEpochMs: Long
)

class KortexAnomalyDetector(private val rules: List<AnomalyRule>) {
    private val _activeIncidents = MutableStateFlow<List<AnomalyIncident>>(emptyList())
    val activeIncidents: StateFlow<List<AnomalyIncident>> = _activeIncidents

    fun evaluate(snapshot: TelemetrySnapshot): List<AnomalyIncident> {
        val triggered = mutableListOf<AnomalyIncident>()
        for (rule in rules) {
            val currentVal = when (rule.metricName) {
                "p99_latency_ms" -> snapshot.p99LatencyMs
                "error_rate_pct" -> snapshot.errorRatePct
                "db_pool_wait" -> snapshot.dbPoolWaitQueue.toDouble()
                "active_coroutines" -> snapshot.activeCoroutines.toDouble()
                else -> 0.0
            }
            if (currentVal > rule.threshold) {
                triggered.add(
                    AnomalyIncident(
                        id = "inc_${snapshot.timestampEpochMs}_${rule.id}",
                        ruleId = rule.id,
                        title = "${rule.name} (${currentVal} > ${rule.threshold})",
                        severity = rule.severity,
                        observedValue = currentVal,
                        thresholdValue = rule.threshold,
                        remediationPlaybook = rule.remediationPlaybook,
                        triggeredAtEpochMs = snapshot.timestampEpochMs
                    )
                )
            }
        }
        _activeIncidents.value = triggered
        return triggered
    }
}
