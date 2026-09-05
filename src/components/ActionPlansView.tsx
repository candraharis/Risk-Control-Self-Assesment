import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { ActionPlan, ActionPlanStatus, ActionPlanPriority } from '../../shared/types.ts';
import {
  Calendar,
  User,
  ExternalLink,
  Edit2,
  X
} from 'lucide-react';

interface ActionPlansViewProps {
  onSelectRisk: (riskId: number) => void;
}

export const ActionPlansView: React.FC<ActionPlansViewProps> = ({ onSelectRisk }) => {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null);

  // Edit form state
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ActionPlanStatus>('IN_PROGRESS');
  const [remarks, setRemarks] = useState('');
  const [evidence, setEvidence] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchActionPlans = async () => {
    try {
      setLoading(true);
      const data = await api.getActionPlans({
        status: statusFilter || undefined
      });
      setActionPlans(data);
    } catch (err) {
      console.error('Failed to load action plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionPlans();
  }, [statusFilter]);

  const handleOpenEdit = (plan: ActionPlan) => {
    setEditingPlan(plan);
    setProgress(plan.progress);
    setStatus(plan.status);
    setRemarks(plan.remarks || '');
    setEvidence(plan.evidence || '');
  };

  const handleSaveProgress = async () => {
    if (!editingPlan) return;
    try {
      setUpdating(true);
      await api.updateActionPlan(editingPlan.id, {
        progress,
        status: progress === 100 ? 'COMPLETED' : status,
        remarks,
        evidence
      });
      setEditingPlan(null);
      fetchActionPlans();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityBadge = (priority: ActionPlanPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-[#FEE2E2] text-red-900 border-[#EF4444]';
      case 'HIGH':
        return 'bg-[#FFEDD5] text-orange-950 border-[#FB923C]';
      case 'MEDIUM':
        return 'bg-[#FEF3C7] text-amber-900 border-[#FDE68A]';
      case 'LOW':
      default:
        return 'bg-[#F4F4F2] text-[#888883] border-[#D1D1CB]';
    }
  };

  const getStatusBadge = (s: ActionPlanStatus) => {
    switch (s) {
      case 'COMPLETED':
        return 'bg-[#ECFDF5] text-emerald-900 border-[#A7F3D0]';
      case 'OVERDUE':
        return 'bg-[#FEE2E2] text-red-900 border-[#EF4444]';
      case 'IN_PROGRESS':
        return 'bg-[#EFF6FF] text-blue-900 border-blue-200';
      case 'NOT_STARTED':
      default:
        return 'bg-[#F4F4F2] text-[#888883] border-[#D1D1CB]';
    }
  };

  const getDaysLeftText = (targetDate: string, currentStatus: string) => {
    if (currentStatus === 'COMPLETED') return 'Tuntas';
    const target = new Date(targetDate);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Terlambat ${Math.abs(diffDays)} Hari`;
    } else if (diffDays === 0) {
      return 'Jatuh Tempo Hari Ini!';
    } else {
      return `Sisa ${diffDays} Hari`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D1D1CB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">
              Mitigation Action Plans Tracker
            </h2>
            <span className="text-[10px] bg-white border border-[#D1D1CB] text-[#1A1A1A] px-2 py-0.5 font-mono font-bold">
              {actionPlans.length} Total Plans
            </span>
          </div>
          <p className="text-xs text-[#888883] mt-1 font-mono">
            Monitoring rencana perbaikan mitigasi risiko, eskalasi keterlambatan, dan pencapaian progress PIC
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['', 'NOT_STARTED', 'IN_PROGRESS', 'OVERDUE', 'COMPLETED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer border ${
                statusFilter === st
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-white hover:bg-[#E6E6E1] text-[#888883] border-[#D1D1CB]'
              }`}
            >
              {st === '' ? 'All Statuses' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Action Plans Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white p-12 text-center text-[#888883] border border-[#D1D1CB]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6321] mx-auto mb-2"></div>
            Loading action plans...
          </div>
        ) : actionPlans.length === 0 ? (
          <div className="bg-white p-12 text-center text-[#888883] text-xs font-mono border border-[#D1D1CB]">
            No action plans match the selected filter.
          </div>
        ) : (
          actionPlans.map(plan => (
            <div
              key={plan.id}
              className={`bg-white border p-5 shadow-xs transition-all ${
                plan.status === 'OVERDUE'
                  ? 'border-l-4 border-l-[#EF4444] border-[#D1D1CB]'
                  : 'border-[#D1D1CB]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold font-mono border ${getStatusBadge(plan.status)}`}>
                      {plan.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold font-mono border ${getPriorityBadge(plan.priority)}`}>
                      {plan.priority} Priority
                    </span>
                    <button
                      onClick={() => onSelectRisk(plan.risk_id)}
                      className="text-[#FF6321] hover:underline text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Risk #{plan.risk_id}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>

                  <h3 className="text-base font-serif italic text-[#1A1A1A] leading-snug">{plan.action_plan}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#888883] font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-[#888883]" />
                      PIC: <strong className="text-[#1A1A1A]">{plan.pic?.name || 'Assigned PIC'}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3.5 w-3.5 text-[#888883]" />
                      Due: {new Date(plan.target_date).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span
                      className={`font-semibold ${
                        plan.status === 'OVERDUE'
                          ? 'text-[#EF4444] font-bold'
                          : plan.status === 'COMPLETED'
                          ? 'text-emerald-800'
                          : 'text-[#F59E0B]'
                      }`}
                    >
                      {getDaysLeftText(plan.target_date, plan.status)}
                    </span>
                  </div>

                  {plan.remarks && (
                    <p className="text-xs text-[#1A1A1A] bg-[#F4F4F2] p-2 border border-[#D1D1CB] mt-2 font-mono">
                      <strong>Remarks:</strong> {plan.remarks}
                    </p>
                  )}
                </div>

                {/* Progress & Action */}
                <div className="sm:w-64 flex flex-col justify-between items-end gap-3 pt-2 sm:pt-0">
                  <div className="w-full">
                    <div className="flex items-center justify-between text-xs mb-1 font-mono">
                      <span className="text-[#888883]">PROGRESS</span>
                      <span className="font-bold text-[#1A1A1A]">{plan.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E6E6E1]">
                      <div
                        className={`h-full transition-all ${
                          plan.status === 'COMPLETED'
                            ? 'bg-emerald-600'
                            : plan.status === 'OVERDUE'
                            ? 'bg-[#EF4444]'
                            : 'bg-[#FF6321]'
                        }`}
                        style={{ width: `${plan.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#E6E6E1] text-[#1A1A1A] border border-[#D1D1CB] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Update Progress</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Update Progress Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1D1CB] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D1D1CB] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">Update Action Plan Progress</h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-[#888883] hover:text-[#1A1A1A] p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm font-serif italic text-[#1A1A1A]">{editingPlan.action_plan}</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#888883]">PROGRESS ({progress}%)</span>
                  <span className="font-bold text-[#1A1A1A]">{progress === 100 ? 'COMPLETED' : 'IN PROGRESS'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={e => setProgress(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E6E6E1] cursor-pointer accent-[#FF6321]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888883] font-mono mb-1">Status Override</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ActionPlanStatus)}
                  className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A]"
                >
                  <option value="NOT_STARTED">NOT STARTED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888883] font-mono mb-1">Remarks / Note</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] placeholder:text-[#888883]"
                  placeholder="Catatan update pelaksanaan..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888883] font-mono mb-1">Evidence / Deliverable Link</label>
                <input
                  type="text"
                  value={evidence}
                  onChange={e => setEvidence(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] placeholder:text-[#888883]"
                  placeholder="Link dokumen bukti tindak lanjut..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D1D1CB]">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 bg-white border border-[#D1D1CB] text-[#888883] hover:text-[#1A1A1A] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProgress}
                disabled={updating}
                className="px-5 py-2 bg-[#FF6321] hover:bg-[#E5591D] text-white text-xs font-bold uppercase tracking-widest cursor-pointer shadow-xs disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Progress'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
