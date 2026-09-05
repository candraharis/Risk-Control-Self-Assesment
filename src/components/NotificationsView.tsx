import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { NotificationLog } from '../../shared/types.ts';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications({
        notification_type: typeFilter || undefined
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    try {
      setTestSending(true);
      setTestStatus(null);
      await api.sendTestEmail(testEmail, 'RCSA Enterprise Evaluator');
      setTestStatus({ success: true, message: `Test email dispatched to ${testEmail}! Log created.` });
      setTestEmail('');
      fetchNotifications();
    } catch (err: any) {
      setTestStatus({ success: false, message: err.message || 'Failed to dispatch test email' });
    } finally {
      setTestSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-[#ECFDF5] text-emerald-900 border-[#A7F3D0]';
      case 'FAILED':
        return 'bg-[#FEE2E2] text-red-900 border-[#EF4444]';
      case 'PENDING':
      default:
        return 'bg-[#FEF3C7] text-amber-900 border-[#FDE68A]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D1D1CB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">
              Enterprise Automated Alerts &amp; Escalations
            </h2>
            <span className="text-[10px] bg-white border border-[#D1D1CB] text-[#1A1A1A] px-2 py-0.5 font-mono font-bold">
              {logs.length} Sent Logs
            </span>
          </div>
          <p className="text-xs text-[#888883] mt-1 font-mono">
            Log pengiriman notifikasi email otomatis H-7, H-3, H-1, Due Date, dan eskalasi keterlambatan bertingkat
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#E6E6E1] text-[#1A1A1A] border border-[#D1D1CB] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Test Email Dispatch Panel */}
      <div className="bg-white border border-[#D1D1CB] p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] mb-1">
          <Mail className="h-4 w-4 text-[#FF6321]" />
          <span>Test Live Email Dispatcher</span>
        </div>
        <p className="text-xs text-[#888883] font-serif italic mb-4">
          Kirimkan email uji coba langsung untuk memverifikasi template HTML responsif RCSA Enterprise.
        </p>

        <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="email"
            placeholder="Masukkan email tujuan (contoh: user@company.com)..."
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            className="flex-1 w-full text-xs p-2.5 bg-white border border-[#D1D1CB] text-[#1A1A1A] placeholder:text-[#888883] focus:outline-hidden focus:border-[#1A1A1A]"
            required
          />
          <button
            type="submit"
            disabled={testSending}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#FF6321] hover:bg-[#E5591D] text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{testSending ? 'Sending...' : 'Send Test Alert'}</span>
          </button>
        </form>

        {testStatus && (
          <div
            className={`mt-3 p-3 text-xs font-mono flex items-center gap-2 border ${
              testStatus.success
                ? 'bg-[#ECFDF5] text-emerald-900 border-[#A7F3D0]'
                : 'bg-[#FEE2E2] text-red-900 border-[#EF4444]'
            }`}
          >
            {testStatus.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <span>{testStatus.message}</span>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#D1D1CB] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="w-full sm:w-72">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A] cursor-pointer"
          >
            <option value="">All Notification Types</option>
            <option value="ACTION_PLAN_H7">Reminder H-7</option>
            <option value="ACTION_PLAN_H3">Reminder H-3</option>
            <option value="ACTION_PLAN_H1">Reminder H-1</option>
            <option value="ACTION_PLAN_DUE">Due Date (Hari H)</option>
            <option value="ACTION_PLAN_OVERDUE">Overdue Initial Alert</option>
            <option value="ESCALATION_7D">Escalation &gt; 7 Days (Risk Management)</option>
            <option value="ESCALATION_14D">Escalation &gt; 14 Days (Executive Management)</option>
            <option value="RISK_SUBMITTED">Risk Submitted</option>
            <option value="RISK_APPROVED">Risk Approved</option>
            <option value="SYSTEM_TEST">System Test</option>
          </select>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white border border-[#D1D1CB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-[#888883]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6321] mx-auto mb-2"></div>
            Loading notification logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#888883] text-xs font-mono">
            No notification records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F4F2] border-b border-[#D1D1CB] text-[#888883] font-bold uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event / Type</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject &amp; Message Summary</th>
                  <th className="py-3 px-4 text-center">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E6E1]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#F4F4F2]/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-[#888883] font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-[#F4F4F2] border border-[#D1D1CB] font-mono text-[10px] text-[#1A1A1A]">
                        {log.notification_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#1A1A1A] font-mono text-xs">
                      {log.recipient_email}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-serif italic text-sm text-[#1A1A1A]">{log.subject}</div>
                      <div className="text-[11px] text-[#888883] line-clamp-1 mt-0.5 font-mono">{log.body}</div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 font-mono font-bold text-[10px] border ${getStatusBadge(log.status)}`}>
                        {log.status}
                      </span>
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
