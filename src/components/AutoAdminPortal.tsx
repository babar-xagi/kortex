import React, { useState } from 'react';
import { ShieldCheck, Users, ShoppingBag, FileText, Plus, Search, Lock } from 'lucide-react';
import {
  AdminUserRecord,
  AdminOrderRecord,
  AdminAuditRecord
} from '../data/kortexData';

interface AutoAdminPortalProps {
  users: AdminUserRecord[];
  orders: AdminOrderRecord[];
  auditLogs: AdminAuditRecord[];
  onToggleUserStatus: (userId: string) => void;
  onCreateAdminUser: (email: string, fullName: string, role: AdminUserRecord['role']) => void;
  onUpdateOrderStatus: (orderId: string, status: AdminOrderRecord['status']) => void;
  onSimulateRbacCheck: (role: AdminUserRecord['role'], permission: string, resource: string) => void;
}

export const AutoAdminPortal: React.FC<AutoAdminPortalProps> = ({
  users,
  orders,
  auditLogs,
  onToggleUserStatus,
  onCreateAdminUser,
  onUpdateOrderStatus,
  onSimulateRbacCheck
}) => {
  const [activeTable, setActiveTable] = useState<'users' | 'orders' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<AdminUserRecord['role']>('BACKEND_DEV');

  // Security RBAC Simulator state
  const [testRole, setTestRole] = useState<AdminUserRecord['role']>('BACKEND_DEV');
  const [testPermission, setTestPermission] = useState('migrations:apply');
  const [lastRbacVerdict, setLastRbacVerdict] = useState<{
    allowed: boolean;
    role: string;
    permission: string;
    detail: string;
  } | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredOrders = orders.filter(
    (o) =>
      o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim()) return;
    onCreateAdminUser(newUserEmail.trim(), newUserName.trim(), newUserRole);
    setNewUserEmail('');
    setNewUserName('');
    setShowAddUserForm(false);
  };

  const handleRunRbacTest = () => {
    const rolePermissions: Record<AdminUserRecord['role'], string[]> = {
      SRE_ADMIN: ['users:read', 'users:write', 'orders:write', 'migrations:apply', 'alerts:manage'],
      BACKEND_DEV: ['users:read', 'orders:write', 'telemetry:view'],
      SECURITY_AUDITOR: ['users:read', 'telemetry:view', 'audit:read'],
      SERVICE_ACCOUNT: ['orders:write', 'telemetry:view']
    };
    const allowed = rolePermissions[testRole].includes(testPermission);
    setLastRbacVerdict({
      allowed,
      role: testRole,
      permission: testPermission,
      detail: allowed
        ? `Ed25519 JWT Guard GRANTED '${testPermission}' to ${testRole} in 74µs`
        : `Ed25519 JWT Guard DENIED '${testPermission}' for ${testRole} (HTTP 403 Forbidden)`
    });
    onSimulateRbacCheck(testRole, testPermission, `rbac://${testPermission}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            01. Kortex Auto-Admin Backoffice & Built-in RBAC Security
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Django-style <span className="font-mono text-slate-200">admin.register(UsersTable, OrdersTable, AuditLogsTable)</span> with Argon2id password hashing, Ed25519 JWT guards, and immutable audit logging
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-[#1E293B] rounded-md">
          <button
            onClick={() => setActiveTable('users')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTable === 'users'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            UsersTable ({users.length})
          </button>
          <button
            onClick={() => setActiveTable('orders')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTable === 'orders'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OrdersTable ({orders.length})
          </button>
          <button
            onClick={() => setActiveTable('audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTable === 'audit'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SecurityAuditLogs ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Main Split: Auto-Admin Data Grid (Left 8) + RBAC & Argon2id Security Tester (Right 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Registered Model Data Grid */}
        <div className="lg:col-span-8 bg-[#111827] border border-[#1E293B] rounded-lg">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[220px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search email, name, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0B0F17] border border-[#1E293B] rounded-md text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {activeTable === 'users' && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-[#0B0F17] border border-[#1E293B] rounded-md text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SRE_ADMIN">SRE_ADMIN</option>
                  <option value="BACKEND_DEV">BACKEND_DEV</option>
                  <option value="SECURITY_AUDITOR">SECURITY_AUDITOR</option>
                  <option value="SERVICE_ACCOUNT">SERVICE_ACCOUNT</option>
                </select>
              )}
            </div>

            {activeTable === 'users' && (
              <button
                onClick={() => setShowAddUserForm(!showAddUserForm)}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddUserForm ? 'Cancel' : 'Create User (Argon2id)'}
              </button>
            )}
          </div>

          {/* Add User Form */}
          {activeTable === 'users' && showAddUserForm && (
            <form onSubmit={handleAddUser} className="p-4 border-b border-[#1E293B] bg-[#0B0F17] space-y-3">
              <div className="text-xs font-semibold text-slate-200">
                Provision New Principal in UsersTable
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  required
                  placeholder="engineer@kortex.io"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#111827] border border-[#1E293B] rounded text-slate-100"
                />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#111827] border border-[#1E293B] rounded text-slate-100"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as AdminUserRecord['role'])}
                  className="px-3 py-1.5 text-xs font-mono bg-[#111827] border border-[#1E293B] rounded text-slate-100"
                >
                  <option value="SRE_ADMIN">SRE_ADMIN</option>
                  <option value="BACKEND_DEV">BACKEND_DEV</option>
                  <option value="SECURITY_AUDITOR">SECURITY_AUDITOR</option>
                  <option value="SERVICE_ACCOUNT">SERVICE_ACCOUNT</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md cursor-pointer"
                >
                  Hash Password & Insert Record
                </button>
              </div>
            </form>
          )}

          {/* Table 1: UsersTable */}
          {activeTable === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[11px] font-mono text-slate-400 bg-[#0B0F17]">
                    <th className="py-2.5 px-4">Principal</th>
                    <th className="py-2.5 px-4">RBAC Role</th>
                    <th className="py-2.5 px-4">Credential Hash</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-100">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {u.email} · {u.id}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-400">{u.role}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {u.passwordHashAlgorithm}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors cursor-pointer"
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table 2: OrdersTable */}
          {activeTable === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[11px] font-mono text-slate-400 bg-[#0B0F17]">
                    <th className="py-2.5 px-4">Order ID & Trace</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4 text-right">Amount (USD)</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Mutate State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs font-mono">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="text-slate-100 font-semibold">{ord.id}</div>
                        <div className="text-[11px] text-indigo-400">
                          {ord.traceId} · {ord.region}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{ord.customerEmail}</td>
                      <td className="py-3 px-4 text-right text-slate-100 tabular-nums">
                        ${ord.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            ord.status === 'SETTLED'
                              ? 'text-emerald-400'
                              : ord.status === 'FLAGGED'
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ord.status !== 'SETTLED' ? (
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'SETTLED')}
                            className="px-2.5 py-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded transition-colors cursor-pointer"
                          >
                            Mark Settled
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'FLAGGED')}
                            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                          >
                            Flag Order
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table 3: Immutable Audit Logs */}
          {activeTable === 'audit' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[11px] font-mono text-slate-400 bg-[#0B0F17]">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Actor & Role</th>
                    <th className="py-2.5 px-4">Action & Resource</th>
                    <th className="py-2.5 px-4">Outcome</th>
                    <th className="py-2.5 px-4 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-400 tabular-nums">{log.timestamp}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200">{log.actor}</div>
                        <div className="text-[11px] text-indigo-400">{log.role}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-100">{log.action}</div>
                        <div className="text-[11px] text-slate-400">{log.targetResource}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={log.outcome === 'ALLOWED' ? 'text-emerald-400' : 'text-red-400'}>
                          {log.outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 tabular-nums">
                        {log.latencyMicros} µs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 4 Cols: RBAC Guard & Policy Simulator */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-lg p-5 space-y-4">
          <div className="border-b border-[#1E293B] pb-3">
            <h3 className="text-base font-semibold text-slate-100">
              02. RBAC & JWT Guard Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify fine-grained role permissions and inspect live audit entries
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Principal Role</label>
              <select
                value={testRole}
                onChange={(e) => setTestRole(e.target.value as AdminUserRecord['role'])}
                className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-[#1E293B] rounded text-slate-100"
              >
                <option value="SRE_ADMIN">SRE_ADMIN</option>
                <option value="BACKEND_DEV">BACKEND_DEV</option>
                <option value="SECURITY_AUDITOR">SECURITY_AUDITOR</option>
                <option value="SERVICE_ACCOUNT">SERVICE_ACCOUNT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Target Route Scope / Permission</label>
              <select
                value={testPermission}
                onChange={(e) => setTestPermission(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-[#1E293B] rounded text-slate-100"
              >
                <option value="migrations:apply">migrations:apply (Prod DDL)</option>
                <option value="alerts:manage">alerts:manage (SLA Rules)</option>
                <option value="orders:write">orders:write (Create Order)</option>
                <option value="users:write">users:write (Mutate Identity)</option>
                <option value="telemetry:view">telemetry:view (Read Metrics)</option>
              </select>
            </div>

            <button
              onClick={handleRunRbacTest}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Evaluate KortexAuth Guard & Log Audit
            </button>
          </div>

          {lastRbacVerdict && (
            <div className="p-3.5 bg-[#0B0F17] border border-[#1E293B] rounded-md space-y-1.5 text-xs font-mono">
              <div
                className={
                  lastRbacVerdict.allowed ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'
                }
              >
                Verdict: {lastRbacVerdict.allowed ? 'ACCESS ALLOWED (200)' : 'ACCESS DENIED (403)'}
              </div>
              <div className="text-slate-300">{lastRbacVerdict.detail}</div>
            </div>
          )}

          <div className="pt-2 border-t border-[#1E293B] space-y-2">
            <div className="text-xs font-semibold text-slate-200">Kotlin Auto-Admin Configuration</div>
            <pre className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded text-[11px] font-mono text-slate-300 overflow-x-auto">
              <code>{`install(KortexAdmin) {
    register(UsersTable) {
        listDisplay = listOf("email", "role", "status")
        searchFields = listOf("email", "fullName")
        auditMutations = true
    }
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
