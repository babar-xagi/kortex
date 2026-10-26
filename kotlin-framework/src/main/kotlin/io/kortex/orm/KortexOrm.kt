package io.kortex.orm

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * KortexORM & Automated Schema Migration Engine.
 * Provides Django-style declarative ModelTable definitions, suspendable query builders,
 * and deterministic AST diffing for UP/DOWN SQL migration generation.
 */
enum class SqlType(val ddl: String) {
    BIGSERIAL("BIGSERIAL PRIMARY KEY"),
    UUID("UUID PRIMARY KEY DEFAULT gen_random_uuid()"),
    VARCHAR_255("VARCHAR(255)"),
    TEXT("TEXT"),
    INTEGER("INTEGER"),
    BIGINT("BIGINT"),
    DECIMAL(" NUMERIC(12, 2)"),
    BOOLEAN("BOOLEAN"),
    TIMESTAMPTZ("TIMESTAMPTZ")
}

data class ColumnSpec<T>(
    val name: String,
    val sqlType: SqlType,
    val nullable: Boolean = false,
    val unique: Boolean = false,
    val defaultExpr: String? = null,
    val referencesTable: String? = null
)

abstract class ModelTable(val tableName: String) {
    private val _columns = mutableListOf<ColumnSpec<*>>()
    val columns: List<ColumnSpec<*>> get() = _columns

    fun bigSerial(name: String) = registerColumn<Long>(name, SqlType.BIGSERIAL)
    fun uuid(name: String) = registerColumn<String>(name, SqlType.UUID)
    fun varchar(name: String, unique: Boolean = false, nullable: Boolean = false) =
        registerColumn<String>(name, SqlType.VARCHAR_255, nullable = nullable, unique = unique)
    fun text(name: String, nullable: Boolean = false) =
        registerColumn<String>(name, SqlType.TEXT, nullable = nullable)
    fun integer(name: String, defaultExpr: String? = null) =
        registerColumn<Int>(name, SqlType.INTEGER, defaultExpr = defaultExpr)
    fun decimal(name: String, defaultExpr: String? = "0.00") =
        registerColumn<Double>(name, SqlType.DECIMAL, defaultExpr = defaultExpr)
    fun bool(name: String, defaultExpr: String = "true") =
        registerColumn<Boolean>(name, SqlType.BOOLEAN, defaultExpr = defaultExpr)
    fun timestampTz(name: String, defaultExpr: String = "NOW()") =
        registerColumn<String>(name, SqlType.TIMESTAMPTZ, defaultExpr = defaultExpr)
    fun foreignKey(name: String, targetTable: ModelTable) =
        registerColumn<Long>(name, SqlType.BIGINT, referencesTable = targetTable.tableName)

    private fun <T> registerColumn(
        name: String,
        sqlType: SqlType,
        nullable: Boolean = false,
        unique: Boolean = false,
        defaultExpr: String? = null,
        referencesTable: String? = null
    ): ColumnSpec<T> {
        val spec = ColumnSpec<T>(name, sqlType, nullable, unique, defaultExpr, referencesTable)
        _columns.add(spec)
        return spec
    }

    fun toCreateTableSql(): String {
        val colDefs = _columns.joinToString(",\n    ") { col ->
            buildString {
                append("${col.name} ${col.sqlType.ddl.trim()}")
                if (!col.nullable && col.sqlType != SqlType.BIGSERIAL && col.sqlType != SqlType.UUID) {
                    append(" NOT NULL")
                }
                if (col.unique) append(" UNIQUE")
                if (col.defaultExpr != null) append(" DEFAULT ${col.defaultExpr}")
                if (col.referencesTable != null) {
                    append(" REFERENCES ${col.referencesTable}(id) ON DELETE CASCADE")
                }
            }
        }
        return "CREATE TABLE IF NOT EXISTS $tableName (\n    $colDefs\n);"
    }
}

data class MigrationScript(
    val version: String,
    val name: String,
    val upSql: String,
    val downSql: String
)

object KortexMigrationEngine {
    suspend fun generateMigration(
        version: String,
        name: String,
        table: ModelTable,
        addedColumns: List<ColumnSpec<*>> = emptyList()
    ): MigrationScript = withContext(Dispatchers.Default) {
        if (addedColumns.isEmpty()) {
            MigrationScript(
                version = version,
                name = name,
                upSql = table.toCreateTableSql(),
                downSql = "DROP TABLE IF EXISTS ${table.tableName} CASCADE;"
            )
        } else {
            val up = addedColumns.joinToString("\n") { col ->
                "ALTER TABLE ${table.tableName} ADD COLUMN ${col.name} ${col.sqlType.ddl.trim()}${if (!col.nullable) " NOT NULL" else ""}${if (col.defaultExpr != null) " DEFAULT ${col.defaultExpr}" else ""};"
            }
            val down = addedColumns.joinToString("\n") { col ->
                "ALTER TABLE ${table.tableName} DROP COLUMN IF EXISTS ${col.name};"
            }
            MigrationScript(version, name, up, down)
        }
    }
}
