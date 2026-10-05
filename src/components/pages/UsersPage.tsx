import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, UserX, RefreshCw, Key, CheckCircle2 } from 'lucide-react';
import { User } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (userId: string, currentRole: 'admin' | 'staff', currentStatus: 'active' | 'inactive') => {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin';
    try {
      await api.updateUserRole(userId, newRole, currentStatus);
      setNotice(`User permissions updated to "${newRole.toUpperCase()}".`);
      setTimeout(() => setNotice(null), 3000);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusToggle = async (userId: string, currentRole: 'admin' | 'staff', currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUserRole(userId, currentRole, newStatus);
      setNotice(`Account status changed to "${newStatus.toUpperCase()}".`);
      setTimeout(() => setNotice(null), 3000);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              User Access & Role Governance
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-md">
              RBAC Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer store staff accounts, toggle Admin / Staff roles, and manage active session states
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="self-start sm:self-auto p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh user accounts"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Role Definitions Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-700 font-bold">
            <Shield className="w-4 h-4" />
            <span>Store Admin Role</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Full unconstrained privileges: User administration, master inventory deletion, pricing overrides, supplier contracts, and automated AI configurations.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <UserCheck className="w-4 h-4" />
            <span>Inventory Staff Role</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Operational privileges: Stock intakes, physical shelf audits, customer POS order creation, customer invoicing, and reading demand forecasts.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4 font-mono">Phone</th>
              <th className="py-3 px-4 text-center">Assigned Role</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 font-mono">Registered</th>
              <th className="py-3 px-4 text-right">Access Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isSelf = currentUser?.id === u.id;

              return (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    {isSelf && (
                      <span className="text-[10px] text-indigo-600 font-mono font-medium">(You)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.phone || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                        u.role === 'admin'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{u.createdAt}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role, u.status)}
                        disabled={isSelf}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded transition-colors"
                      >
                        Switch to {u.role === 'admin' ? 'Staff' : 'Admin'}
                      </button>

                      <button
                        onClick={() => handleStatusToggle(u.id, u.role, u.status)}
                        disabled={isSelf}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                          u.status === 'active'
                            ? 'text-red-700 bg-red-50 hover:bg-red-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        } disabled:opacity-30`}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
