import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Risk, Unit, RiskCategory } from '../../shared/types.ts';
import {
  Search,
  Download,
  PlusCircle,
  X,
  Trash2,
  ChevronRight
} from 'lucide-react';

interface RiskRegisterViewProps {
  onSelectRisk: (riskId: number) => void;
  onOpenNewRiskModal: () => void;
  initialFilters?: {
    type?: 'inherent' | 'residual';
    likelihood?: number | null;
    impact?: number | null;
  };
  onClearMatrixFilter?: () => void;
}

export const RiskRegisterView: React.FC<RiskRegisterViewProps> = ({
  onSelectRisk,
  onOpenNewRiskModal,
  initialFilters,
  onClearMatrixFilter
}) => {
  const { user } = useAuth();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<RiskCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: search || undefined,
        unit_id: unitFilter || undefined,
        risk_category_id: categoryFilter || undefined,
        inherent_rating: ratingFilter || undefined,
        status: statusFilter || undefined
      };

      if (initialFilters?.likelihood && initialFilters?.impact) {
        if (initialFilters.type === 'inherent') {
          params.inherent_likelihood = initialFilters.likelihood;
          params.inherent_impact = initialFilters.impact;
        } else {
          params.residual_likelihood = initialFilters.likelihood;
          params.residual_impact = initialFilters.impact;
        }
      }

      const [riskList, unitList, catList] = await Promise.all([
        api.getRisks(params),
        api.getUnits(),
        api.getCategories()
      ]);

      setRisks(riskList);
      setUnits(unitList);
      setCategories(catList);
    } catch (err) {
      console.error('Failed to load risk register:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [search, unitFilter, categoryFilter, ratingFilter, statusFilter, initialFilters]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this risk assessment?')) return;
    try {
      await api.deleteRisk(id);
      fetchRisks();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'EXTREME':
        return 'bg-[#FEE2E2] text-red-900 border-[#EF4444]';
      case 'HIGH':
        return 'bg-[#FFEDD5] text-orange-950 border-[#FB923C]';
      case 'MODERATE':
        return 'bg-[#FEF3C7] text-amber-900 border-[#FDE68A]';
      case 'LOW':
      default:
        return 'bg-[#ECFDF5] text-emerald-900 border-[#A7F3D0]';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-[#ECFDF5] text-emerald-900 border-[#A7F3D0]';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'bg-[#EFF6FF] text-blue-950 border-blue-200';
      case 'REVISION_REQUIRED':
        return 'bg-[#FFF1F2] text-rose-900 border-rose-200';
      case 'CLOSED':
        return 'bg-[#F4F4F2] text-[#888883] border-[#D1D1CB]';
      case 'DRAFT':
      default:
        return 'bg-[#FFFBEB] text-amber-950 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D1CB] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">
              Enterprise Risk Register
            </h2>
            <span className="text-[10px] bg-white border border-[#D1D1CB] text-[#1A1A1A] px-2 py-0.5 font-mono font-bold">
              {risks.length} Assessments
            </span>
          </div>
          <p className="text-xs text-[#888883] mt-1 font-mono">
            Daftar lengkap registrasi risiko terpadu, inherent score, kontrol, dan residual risk
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* CSV Export Button */}
          <a
            id="btn-export-risk-csv"
            href={`/api/reports/risk-register/csv${unitFilter ? `?unit_id=${unitFilter}` : ''}`}
            download
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#E6E6E1] text-[#1A1A1A] border border-[#D1D1CB] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>

          {/* New Assessment */}
          {(user?.role === 'ADMIN' || user?.role === 'RISK_OWNER' || user?.role === 'RISK_MANAGEMENT') && (
            <button
              id="btn-register-new-risk"
              onClick={onOpenNewRiskModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF6321] hover:bg-[#E5591D] text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>+ New Risk</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#D1D1CB] p-5 space-y-4 shadow-xs">
        {/* Active Matrix Filter Banner */}
        {initialFilters?.likelihood && initialFilters?.impact && (
          <div className="flex items-center justify-between bg-[#F4F4F2] border border-[#D1D1CB] px-3 py-2 text-xs text-[#1A1A1A] font-mono">
            <span>
              FILTERED BY 5×5 MATRIX: <strong>{initialFilters.type?.toUpperCase()}</strong> [L:{' '}
              {initialFilters.likelihood}, I: {initialFilters.impact}]
            </span>
            <button
              onClick={onClearMatrixFilter}
              className="text-xs font-bold uppercase tracking-wider text-[#FF6321] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filter</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#888883]" />
            <input
              type="text"
              placeholder="Search risk or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] placeholder:text-[#888883] focus:outline-hidden focus:border-[#1A1A1A]"
            />
          </div>

          {/* Directorate Filter */}
          <div>
            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A] cursor-pointer"
            >
              <option value="">All Work Units</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A] cursor-pointer"
            >
              <option value="">All Categories (12)</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A] cursor-pointer"
            >
              <option value="">All Inherent Ratings</option>
              <option value="LOW">LOW (1-4)</option>
              <option value="MODERATE">MODERATE (5-9)</option>
              <option value="HIGH">HIGH (10-16)</option>
              <option value="EXTREME">EXTREME (17-25)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A] cursor-pointer"
            >
              <option value="">All Workflow Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REVISION_REQUIRED">REVISION_REQUIRED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-white border border-[#D1D1CB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-[#888883]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6321] mx-auto mb-2"></div>
            Loading risk assessments...
          </div>
        ) : risks.length === 0 ? (
          <div className="p-12 text-center text-[#888883] text-xs font-mono">
            No risk assessments match the selected search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F4F2] border-b border-[#D1D1CB] text-[#888883] font-bold uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Risk ID</th>
                  <th className="py-3 px-4">Risk Event & Details</th>
                  <th className="py-3 px-4">Work Unit</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Inherent Risk</th>
                  <th className="py-3 px-4 text-center">Residual Risk</th>
                  <th className="py-3 px-4 text-center">Strategy</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E6E1]">
                {risks.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => onSelectRisk(r.id)}
                    className="hover:bg-[#F4F4F2]/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#1A1A1A] whitespace-nowrap">
                      {r.risk_id}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-serif italic text-sm text-[#1A1A1A] group-hover:text-[#FF6321] transition-colors line-clamp-1">
                        {r.risk_event}
                      </div>
                      <div className="text-[11px] text-[#888883] line-clamp-1 mt-0.5 font-mono">
                        {r.business_process} • {r.sub_process}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#888883] whitespace-nowrap">{r.unit?.name || 'Unit'}</td>
                    <td className="py-3 px-4 text-[#1A1A1A] whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-[#F4F4F2] border border-[#D1D1CB] font-mono font-medium text-[10px]">
                        {r.risk_category?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold font-mono border ${getRatingBadge(r.inherent_rating)}`}>
                        {r.inherent_score} ({r.inherent_rating})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold font-mono border ${getRatingBadge(r.residual_rating)}`}>
                        {r.residual_score} ({r.residual_rating})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-mono text-[10px] font-semibold text-[#888883]">
                        {r.risk_response}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold font-mono border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectRisk(r.id)}
                          className="text-xs font-bold uppercase tracking-wider text-[#FF6321] hover:text-[#E5591D] cursor-pointer"
                        >
                          Inspect
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={e => handleDelete(e, r.id)}
                            className="text-[#888883] hover:text-[#EF4444] transition-colors p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
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
