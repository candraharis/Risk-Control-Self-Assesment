import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { DashboardSummary, Unit } from '../../shared/types.ts';
import { RiskMatrix5x5 } from './RiskMatrix5x5.tsx';
import {
  ArrowRight,
  Filter,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface DashboardViewProps {
  onSelectRisk: (riskId: number) => void;
  onFilterByCell: (type: 'inherent' | 'residual', likelihood: number, impact: number) => void;
  onNavigateToRisks: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectRisk,
  onFilterByCell,
  onNavigateToRisks
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [matrixType, setMatrixType] = useState<'INHERENT' | 'RESIDUAL'>('INHERENT');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sum, uList] = await Promise.all([
        api.getDashboardSummary(selectedUnitId),
        api.getUnits()
      ]);
      setSummary(sum);
      setUnits(uList);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedUnitId]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6321]"></div>
      </div>
    );
  }

  if (!summary) return null;

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

  return (
    <div className="space-y-8">
      {/* Unit Filter & Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D1CB] pb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#888883]">
            Executive Overview
          </h2>
          <p className="text-sm font-serif italic text-[#1A1A1A] mt-0.5">
            Enterprise Inherent &amp; Residual Exposure Assessment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#888883]" />
            <select
              id="select-dashboard-unit-filter"
              value={selectedUnitId || ''}
              onChange={e => setSelectedUnitId(e.target.value ? Number(e.target.value) : undefined)}
              className="text-xs bg-white border border-[#D1D1CB] px-3 py-1.5 font-medium text-[#1A1A1A] focus:outline-hidden cursor-pointer"
            >
              <option value="">All Directorates / Work Units</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#E6E6E1] text-[#1A1A1A] border border-[#D1D1CB] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top 4 Editorial Metric Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Risks */}
        <div className="border-l-2 border-[#1A1A1A] pl-4 py-2 bg-white border border-[#D1D1CB] shadow-xs">
          <p className="text-[10px] uppercase tracking-widest text-[#888883] mb-1 font-bold">Total Risks</p>
          <p className="text-3xl lg:text-4xl font-serif italic text-[#1A1A1A]">{summary.total_risks}</p>
        </div>

        {/* Extreme Risks */}
        <div className="border-l-2 border-[#EF4444] pl-4 py-2 bg-white border border-[#D1D1CB] shadow-xs">
          <p className="text-[10px] uppercase tracking-widest text-[#EF4444] mb-1 font-bold">Extreme</p>
          <p className="text-3xl lg:text-4xl font-serif italic text-[#1A1A1A]">
            {summary.inherent_distribution.EXTREME.toString().padStart(2, '0')}
          </p>
        </div>

        {/* High Risks */}
        <div className="border-l-2 border-[#F97316] pl-4 py-2 bg-white border border-[#D1D1CB] shadow-xs">
          <p className="text-[10px] uppercase tracking-widest text-[#F97316] mb-1 font-bold">High</p>
          <p className="text-3xl lg:text-4xl font-serif italic text-[#1A1A1A]">
            {summary.inherent_distribution.HIGH.toString().padStart(2, '0')}
          </p>
        </div>

        {/* Overdue Action Plans */}
        <div className="border-l-2 border-[#FF6321] pl-4 py-2 bg-white border border-[#D1D1CB] shadow-xs">
          <p className="text-[10px] uppercase tracking-widest text-[#888883] mb-1 font-bold">Overdue Actions</p>
          <p className="text-3xl lg:text-4xl font-serif italic text-[#FF6321]">
            {summary.action_plans_metrics.overdue.toString().padStart(2, '0')}
          </p>
        </div>
      </div>

      {/* Main Grid: Heatmaps & Watchlist Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Heatmap Matrix and Category Bar Chart */}
        <div className="lg:col-span-8 space-y-8">
          {/* Heatmap Matrix with Tab Switcher */}
          <div className="bg-white border border-[#D1D1CB] p-6 shadow-xs relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">
                  Risk Heatmap Matrix (5×5)
                </h3>
                <p className="text-xs text-[#888883] mt-0.5">
                  Klik sel matriks untuk memfilter Risk Register secara instan
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMatrixType('INHERENT')}
                  className={`px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer ${
                    matrixType === 'INHERENT'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F4F4F2] text-[#888883] hover:text-[#1A1A1A]'
                  }`}
                >
                  INHERENT
                </button>
                <button
                  onClick={() => setMatrixType('RESIDUAL')}
                  className={`px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer ${
                    matrixType === 'RESIDUAL'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F4F4F2] text-[#888883] hover:text-[#1A1A1A]'
                  }`}
                >
                  RESIDUAL
                </button>
              </div>
            </div>

            {matrixType === 'INHERENT' ? (
              <RiskMatrix5x5
                title="Inherent Risk Matrix"
                subtitle="Profil risiko intrinsik sebelum mempertimbangkan efektivitas kontrol"
                type="inherent"
                cells={summary.inherent_matrix}
                onCellClick={(lh, imp) => onFilterByCell('inherent', lh, imp)}
              />
            ) : (
              <RiskMatrix5x5
                title="Residual Risk Matrix"
                subtitle="Paparan risiko bersih setelah memperhitungkan seluruh mitigasi kontrol"
                type="residual"
                cells={summary.residual_matrix}
                onCellClick={(lh, imp) => onFilterByCell('residual', lh, imp)}
              />
            )}
          </div>

          {/* Risk by Category Bar Chart */}
          <div className="bg-white border border-[#D1D1CB] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-[#E6E6E1] pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
                  Risk Distribution by Taxonomy Category
                </h3>
                <p className="text-[11px] text-[#888883] mt-0.5">
                  Sebaran frekuensi risiko pada 12 kategori perbankan OJK
                </p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.distribution_by_category} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis dataKey="category_name" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#888883' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888883' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', border: 'none', fontSize: 12 }}
                    formatter={(val: any) => [`${val} risiko`, 'Total']}
                  />
                  <Bar dataKey="count" fill="#1A1A1A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Critical Watchlist, Control Meter, & Recent Activities */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Critical Watchlist in Editorial Dark Ink */}
          <div className="bg-[#1A1A1A] text-white p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 border-b border-white/20 pb-2 text-[#E6E6E1]">
              Critical Watchlist
            </h3>
            <div className="space-y-4">
              {summary.top_risks.slice(0, 4).map(r => (
                <div
                  key={r.id}
                  onClick={() => onSelectRisk(r.id)}
                  className="flex flex-col cursor-pointer hover:opacity-85 transition-opacity group border-b border-white/10 pb-3 last:border-0 last:pb-0"
                >
                  <span
                    className={`text-[10px] font-bold font-mono ${
                      r.inherent_rating === 'EXTREME' ? 'text-[#EF4444]' : 'text-[#F97316]'
                    }`}
                  >
                    {r.inherent_rating} ({r.inherent_score})
                  </span>
                  <span className="text-sm font-serif italic mb-1 text-white group-hover:text-[#FF6321] transition-colors line-clamp-2">
                    {r.risk_event}
                  </span>
                  <span className="text-[9px] text-[#888883] uppercase tracking-wider font-mono">
                    Unit: {r.unit_name} • {r.risk_id}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Control Effectiveness Breakdown */}
          <div className="border border-[#D1D1CB] bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-[#1A1A1A] border-b border-[#E6E6E1] pb-2">
              Control Effectiveness
            </h3>
            <div className="space-y-4 pt-1">
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1A1A1A] mb-1 font-mono">
                  <span className="text-emerald-800">EFFECTIVE</span>
                  <span>{summary.control_effectiveness_summary.EFFECTIVE}</span>
                </div>
                <div className="w-full h-1.5 bg-[#E6E6E1]">
                  <div
                    className="h-full bg-emerald-600"
                    style={{
                      width: `${Math.min(
                        100,
                        (summary.control_effectiveness_summary.EFFECTIVE /
                          (summary.control_effectiveness_summary.EFFECTIVE +
                            summary.control_effectiveness_summary.PARTIALLY_EFFECTIVE +
                            summary.control_effectiveness_summary.INEFFECTIVE || 1)) *
                          100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1A1A1A] mb-1 font-mono">
                  <span className="text-amber-800">PARTIALLY EFFECTIVE</span>
                  <span>{summary.control_effectiveness_summary.PARTIALLY_EFFECTIVE}</span>
                </div>
                <div className="w-full h-1.5 bg-[#E6E6E1]">
                  <div
                    className="h-full bg-[#F59E0B]"
                    style={{
                      width: `${Math.min(
                        100,
                        (summary.control_effectiveness_summary.PARTIALLY_EFFECTIVE /
                          (summary.control_effectiveness_summary.EFFECTIVE +
                            summary.control_effectiveness_summary.PARTIALLY_EFFECTIVE +
                            summary.control_effectiveness_summary.INEFFECTIVE || 1)) *
                          100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1A1A1A] mb-1 font-mono">
                  <span className="text-red-800">INEFFECTIVE</span>
                  <span>{summary.control_effectiveness_summary.INEFFECTIVE}</span>
                </div>
                <div className="w-full h-1.5 bg-[#E6E6E1]">
                  <div
                    className="h-full bg-[#EF4444]"
                    style={{
                      width: `${Math.min(
                        100,
                        (summary.control_effectiveness_summary.INEFFECTIVE /
                          (summary.control_effectiveness_summary.EFFECTIVE +
                            summary.control_effectiveness_summary.PARTIALLY_EFFECTIVE +
                            summary.control_effectiveness_summary.INEFFECTIVE || 1)) *
                          100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities Feed */}
          <div className="border border-[#D1D1CB] bg-white p-6 shadow-xs flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-[#1A1A1A] border-b border-[#E6E6E1] pb-2">
              Recent Activities
            </h3>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex gap-3">
                <span className="text-[#888883]">12:04</span>
                <span className="text-[#1A1A1A]">RSK-2026-00001 [APPROVED] by Risk Management.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[#888883]">10:15</span>
                <span className="text-[#1A1A1A]">ACT-005 Overdue Escalation Level 3 dispatched.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[#888883]">09:44</span>
                <span className="text-[#1A1A1A]">Assessment review initiated for Unit: IT Infra.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[#888883]">08:00</span>
                <span className="text-[#1A1A1A]">System: Daily automated overdue scheduler batch completed.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Watchlist Table */}
      <div className="bg-white border border-[#D1D1CB] shadow-xs">
        <div className="p-5 border-b border-[#D1D1CB] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
              Priority Risk Watchlist (Top High &amp; Extreme Exposures)
            </h3>
            <p className="text-[11px] text-[#888883] mt-0.5 font-serif italic">
              Pengawasan ketat profil risiko tertinggi dan verifikasi rencana aksi
            </p>
          </div>
          <button
            onClick={onNavigateToRisks}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] hover:text-[#FF6321] transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F4F4F2] border-b border-[#D1D1CB] text-[#888883] font-bold uppercase tracking-wider text-[10px] font-mono">
                <th className="py-3 px-4">Risk ID</th>
                <th className="py-3 px-4">Risk Event</th>
                <th className="py-3 px-4">Work Unit</th>
                <th className="py-3 px-4 text-center">Inherent</th>
                <th className="py-3 px-4 text-center">Residual</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E1]">
              {summary.top_risks.map(r => (
                <tr key={r.id} className="hover:bg-[#F4F4F2]/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#1A1A1A]">{r.risk_id}</td>
                  <td className="py-3 px-4 font-serif italic text-sm text-[#1A1A1A] max-w-md truncate" title={r.risk_event}>
                    {r.risk_event}
                  </td>
                  <td className="py-3 px-4 text-[#888883] text-xs">{r.unit_name}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold font-mono border ${getRatingBadge(r.inherent_rating)}`}>
                      {r.inherent_score} ({r.inherent_rating})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold font-mono border ${getRatingBadge(r.residual_rating)}`}>
                      {r.residual_score} ({r.residual_rating})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-[#F4F4F2] text-[#1A1A1A] font-semibold text-[10px] font-mono border border-[#D1D1CB]">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectRisk(r.id)}
                      className="text-xs font-bold uppercase tracking-wider text-[#FF6321] hover:text-[#E5591D] cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
