import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Risk, ActionPlan, Control, ApprovalHistory } from '../../shared/types.ts';
import {
  X,
  Sliders,
  CheckSquare,
  Clock,
  CheckCircle2,
  RotateCcw,
  Check,
  Archive,
  User,
  Building,
  Calendar,
  Layers
} from 'lucide-react';

interface RiskDetailModalProps {
  riskId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const RiskDetailModal: React.FC<RiskDetailModalProps> = ({
  riskId,
  isOpen,
  onClose,
  onRefresh
}) => {
  const { user } = useAuth();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showActionPrompt, setShowActionPrompt] = useState<'APPROVE' | 'REJECT' | 'SUBMIT' | 'CLOSE' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRiskDetails = async () => {
    if (!riskId) return;
    try {
      setLoading(true);
      const data = await api.getRiskById(riskId);
      setRisk(data);
    } catch (err) {
      console.error('Failed to load risk details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && riskId) {
      fetchRiskDetails();
      setShowActionPrompt(null);
      setComments('');
      setErrorMsg('');
    }
  }, [isOpen, riskId]);

  if (!isOpen || !riskId) return null;

  const handleWorkflowAction = async (action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CLOSE') => {
    try {
      setActionLoading(true);
      setErrorMsg('');

      if (action === 'SUBMIT') {
        await api.submitRisk(riskId, comments);
      } else if (action === 'APPROVE') {
        await api.approveRisk(riskId, comments);
      } else if (action === 'REJECT') {
        if (!comments.trim()) {
          setErrorMsg('Komentar revisi wajib diisi untuk penolakan / revisi risiko.');
          setActionLoading(false);
          return;
        }
        await api.rejectRisk(riskId, comments);
      } else if (action === 'CLOSE') {
        await api.closeRisk(riskId, comments);
      }

      await fetchRiskDetails();
      setShowActionPrompt(null);
      setComments('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Workflow transition failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'EXTREME':
        return 'bg-[#FEE2E2] text-red-900 border-red-300';
      case 'HIGH':
        return 'bg-[#FFEDD5] text-orange-950 border-orange-300';
      case 'MODERATE':
        return 'bg-[#FEF3C7] text-amber-900 border-amber-300';
      case 'LOW':
      default:
        return 'bg-[#ECFDF5] text-emerald-900 border-emerald-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-[#ECFDF5] text-emerald-900 border-emerald-300';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'bg-[#EFF6FF] text-blue-900 border-blue-200';
      case 'REVISION_REQUIRED':
        return 'bg-[#FFF1F2] text-rose-900 border-rose-200';
      case 'CLOSED':
        return 'bg-[#F4F4F2] text-[#888883] border-[#D1D1CB]';
      case 'DRAFT':
      default:
        return 'bg-[#FEF3C7] text-amber-900 border-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#D1D1CB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1A1A1A] text-white px-6 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-[#FF6321] bg-white/10 px-2.5 py-1 border border-white/20">
              {risk?.risk_id || 'Risk Detail'}
            </span>
            {risk && (
              <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold border ${getStatusBadge(risk.status)}`}>
                {risk.status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading || !risk ? (
          <div className="p-12 text-center text-[#888883]">
            <div className="animate-spin h-7 w-7 border-2 border-[#FF6321] border-t-transparent mx-auto mb-3"></div>
            <p className="font-serif italic text-sm">Loading risk assessment file...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#1A1A1A]">
            {/* Risk Title & Meta */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] leading-snug">{risk.risk_event}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#888883] font-mono">
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-[#888883]" />
                  {risk.unit?.name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-[#888883]" />
                  Category: <strong className="text-[#1A1A1A] font-sans">{risk.risk_category?.name}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#888883]" />
                  Owner: <span className="text-[#1A1A1A] font-sans">{risk.risk_owner?.name}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#888883]" />
                  {new Date(risk.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Inherent vs Residual Comparison Dashboard Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F4F4F2] border border-[#D1D1CB] p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#888883] mb-1 font-bold">
                  Inherent Risk Assessment
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-mono font-bold text-[#1A1A1A]">
                    Score: {risk.inherent_score}
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-mono font-bold border ${getRatingBadge(risk.inherent_rating)}`}>
                    {risk.inherent_rating}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#555550] mt-2">
                  Likelihood: <strong>{risk.inherent_likelihood}/5</strong> • Impact: <strong>{risk.inherent_impact}/5</strong>
                </div>
              </div>

              <div className="bg-white border border-[#D1D1CB] p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#FF6321] mb-1 font-bold">
                  Residual Risk Post-Control
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-mono font-bold text-[#1A1A1A]">
                    Score: {risk.residual_score}
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-mono font-bold border ${getRatingBadge(risk.residual_rating)}`}>
                    {risk.residual_rating}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#555550] mt-2">
                  Likelihood: <strong>{risk.residual_likelihood}/5</strong> • Impact: <strong>{risk.residual_impact}/5</strong>
                </div>
                {risk.residual_justification && (
                  <div className="text-xs text-[#555550] bg-[#F4F4F2] border border-[#D1D1CB] p-2 mt-2 italic">
                    <strong>Justification:</strong> {risk.residual_justification}
                  </div>
                )}
              </div>
            </div>

            {/* Business Process & Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F4F4F2] p-4 border border-[#D1D1CB] text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#888883] tracking-wider block">Business Process</span>
                <p className="font-medium text-[#1A1A1A] mt-1">{risk.business_process}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-[#888883] tracking-wider block">Sub Process</span>
                <p className="font-medium text-[#1A1A1A] mt-1">{risk.sub_process}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="font-mono text-[10px] uppercase text-[#888883] tracking-wider block">Risk Description</span>
                <p className="text-[#1A1A1A] mt-1 leading-relaxed">{risk.risk_description}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-[#888883] tracking-wider block">Root Cause (Penyebab)</span>
                <p className="text-[#1A1A1A] mt-1 leading-relaxed">{risk.risk_cause}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-[#888883] tracking-wider block">Impact Description (Dampak)</span>
                <p className="text-[#1A1A1A] mt-1 leading-relaxed">{risk.risk_impact_description}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="font-mono text-[10px] uppercase text-[#888883] tracking-wider block">Risk Treatment Strategy</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white border border-[#D1D1CB] text-[#1A1A1A]">
                    {risk.risk_response}
                  </span>
                  {risk.risk_response_justification && (
                    <span className="text-[#555550] italic">{risk.risk_response_justification}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Existing Controls Table */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#1A1A1A] font-bold mb-2 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-[#FF6321]" />
                <span>Existing Controls ({risk.controls?.length || 0})</span>
              </h3>
              <div className="border border-[#D1D1CB] overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F4F4F2] text-[#555550] font-mono text-[10px] uppercase tracking-wider border-b border-[#D1D1CB]">
                      <th className="p-3">Control Code & Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3 text-center">Design</th>
                      <th className="p-3 text-center">Operating</th>
                      <th className="p-3 text-center">Effectiveness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E6E1]">
                    {risk.controls && risk.controls.length > 0 ? (
                      risk.controls.map((c: Control) => (
                        <tr key={c.id} className="hover:bg-[#F4F4F2]/60">
                          <td className="p-3">
                            <div className="font-mono font-bold text-[#1A1A1A]">{c.control_id}</div>
                            <div className="font-medium text-[#1A1A1A]">{c.control_name}</div>
                            <div className="text-[11px] text-[#888883] truncate max-w-sm">{c.control_description}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#555550]">{c.control_type}</td>
                          <td className="p-3 font-mono text-[11px] text-[#555550]">{c.control_frequency}</td>
                          <td className="p-3 text-center text-[10px] font-mono">{c.control_design_effectiveness}</td>
                          <td className="p-3 text-center text-[10px] font-mono">{c.control_operating_effectiveness}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 font-mono font-bold text-[10px] border ${
                              c.control_effectiveness === 'EFFECTIVE'
                                ? 'bg-[#ECFDF5] text-emerald-900 border-emerald-300'
                                : c.control_effectiveness === 'PARTIALLY_EFFECTIVE'
                                ? 'bg-[#FEF3C7] text-amber-900 border-amber-300'
                                : 'bg-[#FEE2E2] text-red-900 border-red-300'
                            }`}>
                              {c.control_effectiveness}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-[#888883] font-serif italic">
                          No controls registered
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Plans Table */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#1A1A1A] font-bold mb-2 flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-[#FF6321]" />
                <span>Mitigation Action Plans ({risk.action_plans?.length || 0})</span>
              </h3>
              <div className="border border-[#D1D1CB] overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F4F4F2] text-[#555550] font-mono text-[10px] uppercase tracking-wider border-b border-[#D1D1CB]">
                      <th className="p-3">Action Plan</th>
                      <th className="p-3">PIC</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Target Date</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E6E1]">
                    {risk.action_plans && risk.action_plans.length > 0 ? (
                      risk.action_plans.map((p: ActionPlan) => (
                        <tr key={p.id} className="hover:bg-[#F4F4F2]/60">
                          <td className="p-3 font-medium text-[#1A1A1A] max-w-xs">{p.action_plan}</td>
                          <td className="p-3 font-mono text-[11px] text-[#555550]">{p.pic?.name || 'PIC'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${
                              p.priority === 'CRITICAL' ? 'bg-[#FEE2E2] text-red-900 border-red-300' : p.priority === 'HIGH' ? 'bg-[#FFEDD5] text-orange-950 border-orange-300' : 'bg-[#F4F4F2] text-[#555550] border-[#D1D1CB]'
                            }`}>
                              {p.priority}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#555550]">{new Date(p.target_date).toLocaleDateString()}</td>
                          <td className="p-3 w-32">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#E6E6E1] h-1.5 overflow-hidden">
                                <div className="bg-[#1A1A1A] h-full" style={{ width: `${p.progress}%` }}></div>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-[#1A1A1A]">{p.progress}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${
                              p.status === 'COMPLETED' ? 'bg-[#ECFDF5] text-emerald-900 border-emerald-300' : p.status === 'OVERDUE' ? 'bg-[#FEE2E2] text-red-900 border-red-300' : 'bg-[#EFF6FF] text-blue-900 border-blue-200'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-[#888883] font-serif italic">
                          No action plans required
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval History Timeline */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#1A1A1A] font-bold mb-2 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#888883]" />
                <span>Approval Workflow & Audit Timeline</span>
              </h3>
              <div className="space-y-2 border border-[#D1D1CB] p-4 bg-[#F4F4F2]">
                {risk.approval_histories && risk.approval_histories.length > 0 ? (
                  risk.approval_histories.map((h: ApprovalHistory) => (
                    <div key={h.id} className="flex items-start gap-3 text-xs border-b border-[#D1D1CB] pb-2 last:border-0 last:pb-0">
                      <div className="w-1.5 h-1.5 bg-[#FF6321] mt-1.5 shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#1A1A1A]">
                            {h.action} by {h.user?.name || 'Authorized Officer'}
                          </span>
                          <span className="text-[10px] font-mono text-[#888883]">
                            {new Date(h.created_at).toLocaleString()}
                          </span>
                        </div>
                        {h.comments && <p className="text-[#555550] mt-0.5 font-serif italic">"{h.comments}"</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[#888883] text-xs text-center font-serif italic">No approval actions logged yet</div>
                )}
              </div>
            </div>

            {/* Action Prompt Form */}
            {showActionPrompt && (
              <div className="p-4 bg-[#F4F4F2] border border-[#FF6321] space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Action Confirmation: {showActionPrompt}
                </div>
                <textarea
                  rows={2}
                  placeholder={showActionPrompt === 'REJECT' ? 'Tuliskan catatan perbaikan yang wajib diperbaiki (Wajib)...' : 'Tuliskan catatan approval atau komentar (opsional)...'}
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-[#D1D1CB] focus:border-[#1A1A1A] focus:outline-hidden"
                />
                {errorMsg && <p className="text-xs text-red-600 font-mono font-semibold">{errorMsg}</p>}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowActionPrompt(null)}
                    className="px-3 py-1.5 text-xs text-[#555550] hover:bg-[#E6E6E1] border border-[#D1D1CB] font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleWorkflowAction(showActionPrompt)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#FF6321] hover:bg-[#E5591D] font-mono uppercase tracking-wider cursor-pointer"
                  >
                    {actionLoading ? 'Processing...' : `Confirm ${showActionPrompt}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Workflow Action Controls (RBAC Governed) */}
        {risk && !showActionPrompt && (
          <div className="bg-[#F4F4F2] border-t border-[#D1D1CB] px-6 py-4 flex items-center justify-between">
            <div className="text-xs text-[#888883] font-mono">
              Current Role: <strong className="text-[#1A1A1A]">{user?.role}</strong>
            </div>

            <div className="flex items-center gap-2">
              {/* Submit Button for DRAFT / REVISION_REQUIRED */}
              {(risk.status === 'DRAFT' || risk.status === 'REVISION_REQUIRED') &&
                (user?.role === 'RISK_OWNER' || user?.role === 'ADMIN') && (
                  <button
                    id="btn-modal-submit-workflow"
                    onClick={() => setShowActionPrompt('SUBMIT')}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#FF6321] hover:bg-[#E5591D] text-white text-xs font-bold uppercase tracking-widest shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Submit for Review</span>
                  </button>
                )}

              {/* Approval Buttons for SUBMITTED / UNDER_REVIEW */}
              {(risk.status === 'SUBMITTED' || risk.status === 'UNDER_REVIEW') &&
                (user?.role === 'RISK_MANAGEMENT' || user?.role === 'ADMIN') && (
                  <>
                    <button
                      id="btn-modal-reject-workflow"
                      onClick={() => setShowActionPrompt('REJECT')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FFF1F2] text-rose-900 border border-rose-300 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Return for Revision</span>
                    </button>
                    <button
                      id="btn-modal-approve-workflow"
                      onClick={() => setShowActionPrompt('APPROVE')}
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest shadow-xs cursor-pointer transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve Assessment</span>
                    </button>
                  </>
                )}

              {/* Close Button for APPROVED */}
              {risk.status === 'APPROVED' &&
                (user?.role === 'RISK_MANAGEMENT' || user?.role === 'ADMIN') && (
                  <button
                    id="btn-modal-close-workflow"
                    onClick={() => setShowActionPrompt('CLOSE')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>Close Risk</span>
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
