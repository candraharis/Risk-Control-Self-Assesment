import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { AuditLog } from '../../shared/types.ts';
import { RefreshCw } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
        limit: 100
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-[#ECFDF5] text-emerald-900 border-[#A7F3D0]';
      case 'APPROVE':
        return 'bg-[#EFF6FF] text-blue-900 border-blue-200';
      case 'REJECT':
        return 'bg-[#FFF1F2] text-rose-900 border-rose-200';
      case 'SUBMIT':
        return 'bg-[#FEF3C7] text-amber-900 border-[#FDE68A]';
      case 'UPDATE':
        return 'bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CB]';
      case 'DELETE':
        return 'bg-[#FEE2E2] text-red-900 border-[#EF4444]';
      default:
        return 'bg-[#F4F4F2] text-[#888883] border-[#D1D1CB]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D1D1CB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">
              Enterprise Audit Trail (Jejak Rekam)
            </h2>
            <span className="text-[10px] bg-white border border-[#D1D1CB] text-[#1A1A1A] px-2 py-0.5 font-mono font-bold">
              {logs.length} Immutable Records
            </span>
          </div>
          <p className="text-xs text-[#888883] mt-1 font-mono">
            Log audit kepatuhan regulasi OJK/Bank Indonesia untuk seluruh modifikasi risiko, persetujuan, dan kontrol
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#E6E6E1] text-[#1A1A1A] border border-[#D1D1CB] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#D1D1CB] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-xs">
        <div>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A] cursor-pointer font-mono"
          >
            <option value="">All Entities</option>
            <option value="Risk">Risk Assessment</option>
            <option value="Control">Control</option>
            <option value="ActionPlan">Action Plan</option>
            <option value="Auth">User Authentication</option>
          </select>
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A] cursor-pointer font-mono"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="SUBMIT">SUBMIT</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="CLOSE">CLOSE</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D1D1CB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-[#888883]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6321] mx-auto mb-2"></div>
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#888883] text-xs font-mono">
            No audit records found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F4F2] border-b border-[#D1D1CB] text-[#888883] font-bold uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User / Actor</th>
                  <th className="py-3 px-4 text-center">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Audit Details / Changes</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E6E1] font-mono text-[11px]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#F4F4F2]/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-[#888883]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#1A1A1A] font-medium font-sans">
                      {log.user?.name || `User #${log.user_id}`}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 font-bold text-[10px] border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans font-semibold text-[#1A1A1A]">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#FF6321] font-bold">
                      #{log.entity_id}
                    </td>
                    <td className="py-3 px-4 font-sans text-xs text-[#1A1A1A] max-w-sm truncate">
                      {log.new_values ? (
                        <span>
                          {log.new_values.event ? `Event: ${log.new_values.event} • ` : ''}
                          {log.new_values.status ? `Status: ${log.new_values.status}` : JSON.stringify(log.new_values).slice(0, 70)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-[#888883]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
