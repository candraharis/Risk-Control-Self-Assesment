import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Unit,
  RiskCategory,
  RiskResponse,
  ControlType,
  ControlFrequency,
  EffectivenessLevel,
  ActionPlanPriority
} from '../../shared/types.ts';
import {
  calculateRiskScore,
  calculateControlEffectiveness,
  validateResidualRisk
} from '../../shared/risk-scoring.ts';
import {
  X,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  ShieldAlert,
  Sliders,
  CheckSquare,
  FileText
} from 'lucide-react';

interface RiskWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (risk: any) => void;
}

const LIKELIHOOD_OPTIONS = [
  { value: 1, label: '1 - Rare', desc: 'Sangat jarang terjadi (<1 kali dalam 5 tahun)' },
  { value: 2, label: '2 - Unlikely', desc: 'Jarang terjadi (1 kali dalam 2-5 tahun)' },
  { value: 3, label: '3 - Possible', desc: 'Dapat terjadi (1 kali per tahun)' },
  { value: 4, label: '4 - Likely', desc: 'Sering terjadi (beberapa kali dalam setahun)' },
  { value: 5, label: '5 - Almost Certain', desc: 'Hampir pasti terjadi (rutin setiap bulan/minggu)' }
];

const IMPACT_OPTIONS = [
  { value: 1, label: '1 - Insignificant', desc: 'Dampak finansial < Rp 50 Juta, tanpa dampak reputasi' },
  { value: 2, label: '2 - Minor', desc: 'Dampak finansial Rp 50 Jt - 250 Jt, komplain lokal' },
  { value: 3, label: '3 - Moderate', desc: 'Dampak finansial Rp 250 Jt - 1 Miliar, teguran internal' },
  { value: 4, label: '4 - Major', desc: 'Dampak finansial Rp 1 M - 10 M, sanksi administratif regulator' },
  { value: 5, label: '5 - Catastrophic', desc: 'Dampak finansial > Rp 10 M, pencabutan izin operasional/sanksi pidana' }
];

export const RiskWizardModal: React.FC<RiskWizardModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Master Data
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<RiskCategory[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Step 1: Identification Form
  const [unitId, setUnitId] = useState<number>(user?.unitId || 1);
  const [ownerId, setOwnerId] = useState<number>(user?.id || 1);
  const [categoryId, setCategoryId] = useState<number>(2); // Default Operational
  const [businessProcess, setBusinessProcess] = useState('');
  const [subProcess, setSubProcess] = useState('');
  const [riskEvent, setRiskEvent] = useState('');
  const [riskDescription, setRiskDescription] = useState('');
  const [riskCause, setRiskCause] = useState('');
  const [riskImpactDesc, setRiskImpactDesc] = useState('');

  // Step 2: Inherent Assessment
  const [inherentLikelihood, setInherentLikelihood] = useState<number>(3);
  const [inherentImpact, setInherentImpact] = useState<number>(3);

  // Step 3: Existing Controls
  const [controls, setControls] = useState<any[]>([
    {
      control_name: '',
      control_description: '',
      control_objective: '',
      control_type: 'PREVENTIVE' as ControlType,
      control_frequency: 'DAILY' as ControlFrequency,
      control_owner_id: user?.id || 1,
      control_design_effectiveness: 'EFFECTIVE' as EffectivenessLevel,
      control_operating_effectiveness: 'EFFECTIVE' as EffectivenessLevel,
      evidence: ''
    }
  ]);

  // Step 4: Residual Assessment
  const [residualLikelihood, setResidualLikelihood] = useState<number>(2);
  const [residualImpact, setResidualImpact] = useState<number>(2);
  const [residualJustification, setResidualJustification] = useState('');

  // Step 5: Risk Treatment & Action Plan
  const [riskResponse, setRiskResponse] = useState<RiskResponse>('REDUCE');
  const [responseJustification, setResponseJustification] = useState('');
  const [actionPlans, setActionPlans] = useState<any[]>([
    {
      action_plan: '',
      pic_id: user?.id || 1,
      priority: 'HIGH' as ActionPlanPriority,
      target_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      remarks: ''
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.getUnits(), api.getCategories(), api.getUsers()])
        .then(([u, c, usr]) => {
          setUnits(u);
          setCategories(c);
          setUsers(usr);
          if (user?.unitId) setUnitId(user.unitId);
          if (user?.id) setOwnerId(user.id);
        })
        .catch(console.error);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Real-time calculations
  const inherentCalc = calculateRiskScore(inherentLikelihood, inherentImpact);
  const residualCalc = calculateRiskScore(residualLikelihood, residualImpact);
  const residualValidation = validateResidualRisk(inherentCalc.score, residualCalc.score, residualJustification);

  // Rating styles
  const getRatingBadgeStyle = (rating: string) => {
    switch (rating) {
      case 'EXTREME':
        return 'bg-red-600 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MODERATE':
        return 'bg-amber-400 text-slate-900';
      case 'LOW':
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  // Control handlers
  const handleAddControl = () => {
    setControls([
      ...controls,
      {
        control_name: '',
        control_description: '',
        control_objective: '',
        control_type: 'PREVENTIVE' as ControlType,
        control_frequency: 'DAILY' as ControlFrequency,
        control_owner_id: user?.id || 1,
        control_design_effectiveness: 'EFFECTIVE' as EffectivenessLevel,
        control_operating_effectiveness: 'PARTIALLY_EFFECTIVE' as EffectivenessLevel,
        evidence: ''
      }
    ]);
  };

  const handleUpdateControl = (index: number, field: string, value: any) => {
    const updated = [...controls];
    updated[index][field] = value;
    setControls(updated);
  };

  const handleRemoveControl = (index: number) => {
    setControls(controls.filter((_, i) => i !== index));
  };

  // Action plan handlers
  const handleAddActionPlan = () => {
    setActionPlans([
      ...actionPlans,
      {
        action_plan: '',
        pic_id: user?.id || 1,
        priority: 'MEDIUM' as ActionPlanPriority,
        target_date: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
        remarks: ''
      }
    ]);
  };

  const handleUpdateActionPlan = (index: number, field: string, value: any) => {
    const updated = [...actionPlans];
    updated[index][field] = value;
    setActionPlans(updated);
  };

  const handleRemoveActionPlan = (index: number) => {
    setActionPlans(actionPlans.filter((_, i) => i !== index));
  };

  // Step navigation validator
  const validateCurrentStep = (): boolean => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!businessProcess.trim() || !subProcess.trim() || !riskEvent.trim() || !riskDescription.trim() || !riskCause.trim() || !riskImpactDesc.trim()) {
        setErrorMsg('Harap lengkapi semua field pada formulir Identifikasi Risiko (Step 1)');
        return false;
      }
    } else if (currentStep === 4) {
      if (!residualValidation.valid) {
        setErrorMsg('Residual Risk tidak boleh lebih besar dari Inherent Risk tanpa Justifikasi yang memadai (minimal 10 karakter).');
        return false;
      }
    } else if (currentStep === 5) {
      if ((inherentCalc.rating === 'HIGH' || inherentCalc.rating === 'EXTREME') && riskResponse === 'ACCEPT') {
        if (!responseJustification || responseJustification.trim().length < 10) {
          setErrorMsg('Tanggapan risiko ACCEPT untuk kategori HIGH/EXTREME memerlukan Justifikasi tertulis dan persetujuan Risk Management.');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(5, prev + 1));
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Submit to API
  const handleSubmit = async (targetStatus: 'DRAFT' | 'SUBMITTED') => {
    if (!validateCurrentStep()) return;

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        unit_id: unitId,
        risk_owner_id: ownerId,
        risk_category_id: categoryId,
        business_process: businessProcess,
        sub_process: subProcess,
        risk_event: riskEvent,
        risk_description: riskDescription,
        risk_cause: riskCause,
        risk_impact_description: riskImpactDesc,
        inherent_likelihood: inherentLikelihood,
        inherent_impact: inherentImpact,
        residual_likelihood: residualLikelihood,
        residual_impact: residualImpact,
        residual_justification: residualJustification || null,
        risk_response: riskResponse,
        risk_response_justification: responseJustification || null,
        status: targetStatus,
        controls: controls.filter(c => c.control_name.trim()),
        action_plans: actionPlans.filter(a => a.action_plan.trim())
      };

      const created = await api.createRisk(payload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create risk assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#D1D1CB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Wizard Header */}
        <div className="bg-[#1A1A1A] text-white px-6 py-5 flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-xl font-serif italic tracking-tight text-[#E6E6E1]">
              Risk Control Self Assessment (RCSA) Wizard
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#888883] font-mono mt-0.5">
              End-to-End Enterprise Risk Governance • OJK Compliant
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Stepper Progress */}
        <div className="bg-[#F4F4F2] border-b border-[#D1D1CB] px-6 py-3">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Risk Identification', icon: FileText },
              { num: 2, title: 'Inherent Risk', icon: ShieldAlert },
              { num: 3, title: 'Existing Controls', icon: Sliders },
              { num: 4, title: 'Residual Risk', icon: CheckCircle },
              { num: 5, title: 'Treatment & Action Plan', icon: CheckSquare }
            ].map(step => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className="flex items-center gap-2 font-mono">
                  <div
                    className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold transition-colors ${
                      isCurrent
                        ? 'bg-[#FF6321] text-white'
                        : isCompleted
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#E6E6E1] text-[#888883]'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : step.num}
                  </div>
                  <span className={`text-[11px] uppercase tracking-wider hidden md:inline ${isCurrent ? 'text-[#1A1A1A] font-bold' : 'text-[#888883]'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Step Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-800">
          {/* STEP 1: RISK IDENTIFICATION */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Step 1: Identifikasi Risiko (Risk Identification)
                </h3>
                <p className="text-xs text-slate-500">
                  Tentukan unit kerja, taksonomi kategori risiko, proses bisnis, serta detail kejadian risiko.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Direktorat / Unit Kerja *</label>
                  <select
                    value={unitId}
                    onChange={e => setUnitId(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Owner (PIC Unit) *</label>
                  <select
                    value={ownerId}
                    onChange={e => setOwnerId(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Risiko (12 Financial) *</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proses Bisnis *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Digital Banking & Open API"
                    value={businessProcess}
                    onChange={e => setBusinessProcess(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Proses *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Customer Onboarding Biometrics"
                    value={subProcess}
                    onChange={e => setSubProcess(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peristiwa Risiko (Risk Event) *</label>
                <input
                  type="text"
                  placeholder="Deskripsikan kejadian risiko secara ringkas dan lugas"
                  value={riskEvent}
                  onChange={e => setRiskEvent(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Uraian / Deskripsi Risiko Lengkap *</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan konteks, skenario risiko, dan lingkungan terjadinya risiko..."
                  value={riskDescription}
                  onChange={e => setRiskDescription(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Penyebab Risiko (Root Cause) *</label>
                  <textarea
                    rows={2}
                    placeholder="Akar penyebab (People, Process, Systems, External Events)..."
                    value={riskCause}
                    onChange={e => setRiskCause(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dampak Risiko (Impact Description) *</label>
                  <textarea
                    rows={2}
                    placeholder="Dampak kerugian finansial, reputasi, kepatuhan hukum, dan operasional..."
                    value={riskImpactDesc}
                    onChange={e => setRiskImpactDesc(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INHERENT RISK ASSESSMENT */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Step 2: Inherent Risk Assessment (Risiko Inheren)
                </h3>
                <p className="text-xs text-slate-500">
                  Nilai kemungkinan (Likelihood) dan dampak (Impact) murni sebelum ada kontrol internal.
                </p>
              </div>

              {/* Reactive Inherent Score Banner */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Formula Perhitungan Otomatis Terpusat (Backend Engine)
                  </span>
                  <div className="text-lg font-bold mt-0.5">
                    Likelihood ({inherentLikelihood}) × Impact ({inherentImpact}) = Inherent Score{' '}
                    <span className="text-sky-400 underline">{inherentCalc.score}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Tingkat Risiko:</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wide shadow-xs ${getRatingBadgeStyle(inherentCalc.rating)}`}>
                    {inherentCalc.rating}
                  </span>
                </div>
              </div>

              {/* Likelihood Selector (1-5) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Kemungkinan Terjadi (Likelihood 1-5)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {LIKELIHOOD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setInherentLikelihood(opt.value)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        inherentLikelihood === opt.value
                          ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-600 text-sky-950 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-1 leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Selector (1-5) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Dampak Kerugian (Impact 1-5)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {IMPACT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setInherentImpact(opt.value)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        inherentImpact === opt.value
                          ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-600 text-sky-950 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-1 leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EXISTING CONTROLS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Step 3: Kontrol Yang Ada (Existing Controls)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftarkan kontrol internal pencegahan (preventive), deteksi (detective), atau perbaikan (corrective).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddControl}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-semibold border border-sky-200 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Kontrol</span>
                </button>
              </div>

              {controls.map((ctl, idx) => {
                const eff = calculateControlEffectiveness(ctl.control_design_effectiveness, ctl.control_operating_effectiveness);
                return (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase">
                        Kontrol #{idx + 1} • Efektivitas Terhitung:{' '}
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          eff.level === 'EFFECTIVE' ? 'bg-emerald-100 text-emerald-800' : eff.level === 'PARTIALLY_EFFECTIVE' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {eff.level}
                        </span>
                      </span>
                      {controls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveControl(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Kontrol *</label>
                        <input
                          type="text"
                          placeholder="Contoh: Dual Approval & Otomasi Gateway Enkripsi"
                          value={ctl.control_name}
                          onChange={e => handleUpdateControl(idx, 'control_name', e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tujuan Kontrol (Objective)</label>
                        <input
                          type="text"
                          placeholder="Mencegah kegagalan otorisasi transaksi liar"
                          value={ctl.control_objective}
                          onChange={e => handleUpdateControl(idx, 'control_objective', e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipe Kontrol</label>
                        <select
                          value={ctl.control_type}
                          onChange={e => handleUpdateControl(idx, 'control_type', e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        >
                          <option value="PREVENTIVE">PREVENTIVE (Pencegahan)</option>
                          <option value="DETECTIVE">DETECTIVE (Pendeteksian)</option>
                          <option value="CORRECTIVE">CORRECTIVE (Perbaikan)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Frekuensi</label>
                        <select
                          value={ctl.control_frequency}
                          onChange={e => handleUpdateControl(idx, 'control_frequency', e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        >
                          <option value="CONTINUOUS">CONTINUOUS (Realtime/Sistem)</option>
                          <option value="DAILY">DAILY (Harian)</option>
                          <option value="WEEKLY">WEEKLY (Mingguan)</option>
                          <option value="MONTHLY">MONTHLY (Bulanan)</option>
                          <option value="QUARTERLY">QUARTERLY (Triwulanan)</option>
                          <option value="ANNUALLY">ANNUALLY (Tahunan)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Design Effectiveness</label>
                        <select
                          value={ctl.control_design_effectiveness}
                          onChange={e => handleUpdateControl(idx, 'control_design_effectiveness', e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        >
                          <option value="EFFECTIVE">EFFECTIVE</option>
                          <option value="PARTIALLY_EFFECTIVE">PARTIALLY EFFECTIVE</option>
                          <option value="INEFFECTIVE">INEFFECTIVE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Operating Effectiveness</label>
                        <select
                          value={ctl.control_operating_effectiveness}
                          onChange={e => handleUpdateControl(idx, 'control_operating_effectiveness', e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        >
                          <option value="EFFECTIVE">EFFECTIVE</option>
                          <option value="PARTIALLY_EFFECTIVE">PARTIALLY EFFECTIVE</option>
                          <option value="INEFFECTIVE">INEFFECTIVE</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bukti Kontrol (Evidence / SOP Ref)</label>
                      <input
                        type="text"
                        placeholder="Contoh: Dokumen SOP-OPS-042 / Laporan Audit Triwulan II"
                        value={ctl.evidence}
                        onChange={e => handleUpdateControl(idx, 'evidence', e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 4: RESIDUAL RISK ASSESSMENT */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Step 4: Residual Risk Assessment (Risiko Residual)
                </h3>
                <p className="text-xs text-slate-500">
                  Tentukan eksposur risiko bersih setelah efektivitas kontrol diperhitungkan.
                </p>
              </div>

              {/* Inherent vs Residual Comparison Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inherent Baseline</span>
                  <div className="text-base font-bold text-slate-800 mt-1">
                    Score: {inherentCalc.score} ({inherentCalc.rating}) [L:{inherentLikelihood} × I:{inherentImpact}]
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-md">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Residual Current Post-Control</span>
                  <div className="text-base font-bold mt-1 flex items-center gap-2">
                    <span>Score: {residualCalc.score} ({residualCalc.rating}) [L:{residualLikelihood} × I:{residualImpact}]</span>
                  </div>
                </div>
              </div>

              {/* Crucial Section 13 Validation Warning */}
              {!residualValidation.valid && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Perhatian: Residual Risk Lebih Besar dari Inherent Risk!</span>
                  </div>
                  <p>
                    Secara metodologi enterprise RCSA, risiko residual tidak boleh melebihi risiko inheren kecuali terdapat faktor eksternal atau kelemahan kontrol baru yang memperparah eksposur. Anda <strong>wajib mengisi Justifikasi tertulis</strong> di bawah.
                  </p>
                </div>
              )}

              {/* Likelihood Residual */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Kemungkinan Residual (Likelihood 1-5)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {LIKELIHOOD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResidualLikelihood(opt.value)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        residualLikelihood === opt.value
                          ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-600 text-sky-950 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Residual */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Dampak Residual (Impact 1-5)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {IMPACT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResidualImpact(opt.value)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        residualImpact === opt.value
                          ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-600 text-sky-950 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Residual Justification Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justifikasi Residual Risk {residualCalc.score > inherentCalc.score && <span className="text-red-500 font-bold">(Wajib Diisi) *</span>}
                </label>
                <textarea
                  rows={2}
                  placeholder="Berikan alasan teknis penurunan atau kondisi residual risk..."
                  value={residualJustification}
                  onChange={e => setResidualJustification(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* STEP 5: RISK TREATMENT & ACTION PLAN */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Step 5: Penanganan Risiko & Rencana Tindak Lanjut (Action Plan)
                </h3>
                <p className="text-xs text-slate-500">
                  Tentukan strategi respon risiko dan rencana aksi perbaikan beserta PIC dan target tanggal penyelesaian.
                </p>
              </div>

              {/* Risk Response Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Strategi Respon Risiko (Risk Treatment Strategy) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'REDUCE', label: 'REDUCE (Mitigasi)', desc: 'Menurunkan frekuensi atau keparahan risiko dengan kontrol tambahan' },
                    { val: 'ACCEPT', label: 'ACCEPT (Penerimaan)', desc: 'Menerima sisa risiko sesuai batas Risk Appetite Statement' },
                    { val: 'TRANSFER', label: 'TRANSFER (Pengalihan)', desc: 'Mengalihkan risiko ke pihak ketiga (asuransi / hedging)' },
                    { val: 'AVOID', label: 'AVOID (Penghindaran)', desc: 'Menghentikan aktivitas atau proses bisnis penyebab risiko' }
                  ].map(r => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setRiskResponse(r.val as RiskResponse)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        riskResponse === r.val
                          ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-600 text-sky-950 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{r.label}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-1 leading-snug">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 14 Validation: Accept for High/Extreme */}
              {(inherentCalc.rating === 'HIGH' || inherentCalc.rating === 'EXTREME') && riskResponse === 'ACCEPT' && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Persetujuan Khusus Diperlukan untuk ACCEPT pada Risiko High / Extreme</span>
                  </div>
                  <p className="text-xs text-red-700">
                    Sesuai kebijakan Enterprise Risk Management, penerimaan risiko tinggi harus dilengkapi justifikasi komprehensif untuk dikaji oleh Risk Management dan Komite Manajemen Risiko.
                  </p>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan justifikasi formal penerimaan risiko tingkat tinggi..."
                    value={responseJustification}
                    onChange={e => setResponseJustification(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Action Plans List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Mitigation Action Plans ({actionPlans.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Rencana aksi akan dimonitor oleh automated scheduler (H-7, H-3, H-1, Due Date, Overdue).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddActionPlan}
                    className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-semibold border border-sky-200 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Action Plan</span>
                  </button>
                </div>

                {actionPlans.map((ap, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Action Plan #{idx + 1}</span>
                      {actionPlans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveActionPlan(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rencana Tindak Lanjut *</label>
                      <input
                        type="text"
                        placeholder="Contoh: Implementasi modul multi-factor biometric dan pentest berkala"
                        value={ap.action_plan}
                        onChange={e => handleUpdateActionPlan(idx, 'action_plan', e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">PIC (Penanggung Jawab) *</label>
                        <select
                          value={ap.pic_id}
                          onChange={e => handleUpdateActionPlan(idx, 'pic_id', Number(e.target.value))}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prioritas</label>
                        <select
                          value={ap.priority}
                          onChange={e => handleUpdateActionPlan(idx, 'priority', e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        >
                          <option value="CRITICAL">CRITICAL</option>
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Penyelesaian *</label>
                        <input
                          type="date"
                          value={ap.target_date}
                          onChange={e => handleUpdateActionPlan(idx, 'target_date', e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
        <div className="bg-[#F4F4F2] border-t border-[#D1D1CB] px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`flex items-center gap-1.5 px-4 py-2 border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-[#888883] border-[#D1D1CB]'
                : 'bg-white border-[#D1D1CB] text-[#1A1A1A] hover:bg-[#E6E6E1]'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                type="button"
                id="btn-wizard-next"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#FF6321] hover:bg-[#E5591D] text-white text-xs font-bold uppercase tracking-widest shadow-xs transition-colors cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-save-draft"
                  disabled={loading}
                  onClick={() => handleSubmit('DRAFT')}
                  className="px-4 py-2 bg-white hover:bg-[#E6E6E1] border border-[#D1D1CB] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  id="btn-submit-risk-approval"
                  disabled={loading}
                  onClick={() => handleSubmit('SUBMITTED')}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#FF6321] hover:bg-[#E5591D] text-white text-xs font-bold uppercase tracking-widest shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{loading ? 'Submitting...' : 'Submit Assessment'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
