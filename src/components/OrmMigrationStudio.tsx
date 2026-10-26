import React, { useState } from 'react';
import { Database, GitCommit, Play, RotateCcw, Plus, CheckCircle2, FileCode } from 'lucide-react';
import { OrmModelSpec, MigrationRecord, OrmColumn } from '../data/kortexData';

interface OrmMigrationStudioProps {
  models: OrmModelSpec[];
  migrations: MigrationRecord[];
  onAddColumnAndGenerateMigration: (
    modelId: string,
    column: OrmColumn,
    migrationName: string
  ) => void;
  onApplyMigration: (migrationId: string) => void;
  onRollbackMigration: (migrationId: string) => void;
}

export const OrmMigrationStudio: React.FC<OrmMigrationStudioProps> = ({
  models,
  migrations,
  onAddColumnAndGenerateMigration,
  onApplyMigration,
  onRollbackMigration
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0].id);
  const [selectedMigrationId, setSelectedMigrationId] = useState<string>(
    migrations[migrations.length - 1]?.id || ''
  );
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<'VARCHAR(255)' | 'INTEGER' | 'BOOLEAN' | 'TIMESTAMPTZ'>('VARCHAR(255)');
  const [newColNullable, setNewColNullable] = useState(true);
  const [newColIndexed, setNewColIndexed] = useState(true);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];
  const selectedMigration =
    migrations.find((m) => m.id === selectedMigrationId) || migrations[migrations.length - 1];

  const handleMakeMigrations = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newColName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    if (!cleanName) return;

    const kotlinTypeMap: Record<typeof newColType, string> = {
      'VARCHAR(255)': 'String',
      INTEGER: 'Int',
      BOOLEAN: 'Boolean',
      TIMESTAMPTZ: 'Instant'
    };

    const nextNum = String(migrations.length + 1).padStart(4, '0');
    const migName = `${nextNum}_add_${cleanName}_to_${selectedModel.tableName}`;

    onAddColumnAndGenerateMigration(
      selectedModel.id,
      {
        name: cleanName,
        kotlinType: kotlinTypeMap[newColType],
        sqlType: newColType,
        nullable: newColNullable,
        unique: false,
        indexed: newColIndexed,
        defaultVal:
          newColType === 'BOOLEAN'
            ? 'false'
            : newColType === 'INTEGER'
            ? '0'
            : newColType === 'TIMESTAMPTZ'
            ? 'NOW()'
            : "'default'"
      },
      migName
    );
    setNewColName('');
  };

  const pendingCount = migrations.filter((m) => m.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header & Model Selector Strip */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              01. KortexORM Declarative Schema DSL & Automated Migrations (Django-Style)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Non-blocking R2DBC PostgreSQL models with AST schema diffing (<span className="font-mono text-slate-200">kortex makemigrations</span> & <span className="font-mono text-slate-200">kortex migrate</span>)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-300">Driver: r2dbc-postgresql 0.8.13</span>
            <span aria-hidden="true">·</span>
            <span className={pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
              {pendingCount > 0 ? `${pendingCount} Pending Migration(s)` : 'Schema Synced'}
            </span>
          </div>
        </div>

        {/* Registered Models */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          {models.map((m) => {
            const isSelected = m.id === selectedModel.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`text-left p-4 rounded-md border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/70'
                    : 'bg-[#0B0F17] border-[#1E293B] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-indigo-400 font-semibold">{m.className}</span>
                  <span className="text-slate-400 tabular-nums">{m.rowCount.toLocaleString()} rows</span>
                </div>
                <div className="text-xs font-mono text-slate-200 mt-1">Table: {m.tableName}</div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: ModelTable DSL + Schema Editor (Left 7) & Migration Ledger + SQL Diffs (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Kotlin ModelTable & Schema Evolution Form */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-lg space-y-0">
          <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                02. Declarative Kotlin ModelTable: {selectedModel.className}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add fields below to synthesize reversible UP/DOWN PostgreSQL migrations
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {selectedModel.columns.length} Columns
            </span>
          </div>

          <div className="p-5 border-b border-[#1E293B]">
            <pre className="p-4 bg-[#0B0F17] border border-[#1E293B] rounded-md text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
              <code>{selectedModel.kotlinCode}</code>
            </pre>
          </div>

          {/* Column Table */}
          <div className="overflow-x-auto border-b border-[#1E293B]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] text-[11px] font-mono text-slate-400 bg-[#0B0F17]">
                  <th className="py-2.5 px-4">Column</th>
                  <th className="py-2.5 px-4">Kotlin Type</th>
                  <th className="py-2.5 px-4">PostgreSQL DDL</th>
                  <th className="py-2.5 px-4">Constraints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] text-xs font-mono">
                {selectedModel.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-100 font-medium">{col.name}</td>
                    <td className="py-2.5 px-4 text-indigo-400">{col.kotlinType}</td>
                    <td className="py-2.5 px-4 text-slate-300">{col.sqlType}</td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {[
                        col.nullable ? 'NULL' : 'NOT NULL',
                        col.unique ? 'UNIQUE' : null,
                        col.indexed ? 'INDEXED' : null,
                        col.foreignKey ? `FK -> ${col.foreignKey}` : null
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Schema Evolution / makemigrations Form */}
          <form onSubmit={handleMakeMigrations} className="p-5 bg-[#0B0F17]/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-200">
                Evolve Schema & Run <span className="font-mono text-indigo-400">kortex makemigrations</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Target: {selectedModel.tableName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">New Column Name (snake_case)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g.stripe_payment_id"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#111827] border border-[#1E293B] rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">SQL Column Type</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#111827] border border-[#1E293B] rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="VARCHAR(255)">VARCHAR(255) (String)</option>
                  <option value="INTEGER">INTEGER (Int)</option>
                  <option value="BOOLEAN">BOOLEAN (Boolean)</option>
                  <option value="TIMESTAMPTZ">TIMESTAMPTZ (Instant)</option>
                </select>
              </div>

              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newColIndexed}
                    onChange={(e) => setNewColIndexed(e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  Create B-Tree Index
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Field & Run kortex makemigrations
            </button>
          </form>
        </div>

        {/* Right 5 Cols: Migration History & UP/DOWN SQL Inspector */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-lg">
          <div className="p-5 border-b border-[#1E293B]">
            <h3 className="text-base font-semibold text-slate-100">
              03. Migration Ledger & Reversible SQL Diffs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect generated migrations, apply pending changes, or test atomic rollbacks
            </p>
          </div>

          <div className="divide-y divide-[#1E293B] border-b border-[#1E293B]">
            {migrations.map((mig) => {
              const isSelected = mig.id === selectedMigration?.id;
              return (
                <div
                  key={mig.id}
                  onClick={() => setSelectedMigrationId(mig.id)}
                  className={`p-4 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-indigo-950/40' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span
                        className={
                          mig.status === 'APPLIED'
                            ? 'text-emerald-400 font-semibold'
                            : mig.status === 'PENDING'
                            ? 'text-amber-400 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        [{mig.status}]
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-200 font-semibold">{mig.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Model: {mig.modelName} · {mig.checksum} · {mig.executionTimeMs}ms
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {mig.status !== 'APPLIED' ? (
                      <button
                        onClick={() => onApplyMigration(mig.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Apply migrate
                      </button>
                    ) : (
                      <button
                        onClick={() => onRollbackMigration(mig.id)}
                        className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Rollback
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedMigration && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Selected: {selectedMigration.name}.sql</span>
                <span>Applied: {selectedMigration.appliedAt}</span>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-mono text-emerald-400">UP Migration SQL (Forward):</div>
                <pre className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded text-xs font-mono text-slate-200 overflow-x-auto">
                  <code>{selectedMigration.upSql}</code>
                </pre>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-mono text-amber-400">DOWN Migration SQL (Reversible Rollback):</div>
                <pre className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded text-xs font-mono text-slate-300 overflow-x-auto">
                  <code>{selectedMigration.downSql}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
