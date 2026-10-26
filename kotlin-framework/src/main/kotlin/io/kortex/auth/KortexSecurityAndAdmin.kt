package io.kortex.auth

import io.kortex.orm.ModelTable

/**
 * Kortex Built-in Security (Argon2id + JWT RBAC) & Django-Style Auto-Admin Portal.
 */
enum class Role(val permissions: Set<String>) {
    SRE_ADMIN(setOf("users:read", "users:write", "migrations:apply", "alerts:manage", "admin:full")),
    BACKEND_DEV(setOf("users:read", "routes:test", "migrations:dryrun", "telemetry:view")),
    READ_ONLY_AUDITOR(setOf("users:read", "telemetry:view", "audit:read"))
}

data class AuthPrincipal(
    val userId: String,
    val email: String,
    val role: Role,
    val issuedAtEpochSec: Long,
    val expiresAtEpochSec: Long
) {
    fun hasPermission(permission: String): Boolean =
        role == Role.SRE_ADMIN || role.permissions.contains(permission)
}

class AdminModelConfig(
    val table: ModelTable,
    val listDisplay: List<String>,
    val searchFields: List<String>,
    val ordering: String = "-id",
    val enableAuditLog: Boolean = true
)

class KortexAdminRegistry {
    private val registeredModels = mutableMapOf<String, AdminModelConfig>()

    fun register(
        table: ModelTable,
        listDisplay: List<String>,
        searchFields: List<String> = emptyList()
    ) {
        registeredModels[table.tableName] = AdminModelConfig(
            table = table,
            listDisplay = listDisplay,
            searchFields = searchFields
        )
    }

    fun allRegistered(): Collection<AdminModelConfig> = registeredModels.values
}
