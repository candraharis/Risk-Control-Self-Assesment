import React from 'react';
import { MatrixCellSummary, RiskRating } from '../../shared/types.ts';
import { calculateRiskRating } from '../../shared/risk-scoring.ts';

interface RiskMatrix5x5Props {
  title: string;
  subtitle: string;
  type: 'inherent' | 'residual';
  cells: MatrixCellSummary[];
  onCellClick?: (likelihood: number, impact: number) => void;
  selectedLikelihood?: number | null;
  selectedImpact?: number | null;
}

const LIKELIHOOD_LABELS = [
  { level: 1, label: '1 - Rare' },
  { level: 2, label: '2 - Unlikely' },
  { level: 3, label: '3 - Possible' },
  { level: 4, label: '4 - Likely' },
  { level: 5, label: '5 - Almost Certain' }
];

const IMPACT_LABELS = [
  { level: 5, label: '5 - Catastrophic' },
  { level: 4, label: '4 - Major' },
  { level: 3, label: '3 - Moderate' },
  { level: 2, label: '2 - Minor' },
  { level: 1, label: '1 - Insignificant' }
];

export const RiskMatrix5x5: React.FC<RiskMatrix5x5Props> = ({
  title,
  subtitle,
  type,
  cells,
  onCellClick,
  selectedLikelihood,
  selectedImpact
}) => {
  const getCellData = (likelihood: number, impact: number) => {
    const found = cells.find(c => c.likelihood === likelihood && c.impact === impact);
    const score = likelihood * impact;
    const rating = calculateRiskRating(score);
    return {
      count: found ? found.count : 0,
      score,
      rating
    };
  };

  const getCellColor = (rating: RiskRating, count: number, isSelected: boolean) => {
    let base = '';
    switch (rating) {
      case 'EXTREME':
        base = count > 0 
          ? 'bg-[#EF4444] text-white font-bold hover:bg-[#DC2626]' 
          : 'bg-[#FEE2E2] text-red-900 border-white hover:bg-red-100';
        break;
      case 'HIGH':
        base = count > 0 
          ? 'bg-[#FB923C] text-white font-bold hover:bg-[#F97316]' 
          : 'bg-[#FFEDD5] text-amber-950 border-white hover:bg-amber-100';
        break;
      case 'MODERATE':
        base = count > 0 
          ? 'bg-[#FDE68A] text-[#1A1A1A] font-bold hover:bg-[#FCD34D]' 
          : 'bg-[#FEF3C7] text-amber-900 border-white hover:bg-amber-50';
        break;
      case 'LOW':
      default:
        base = count > 0 
          ? 'bg-[#A7F3D0] text-emerald-950 font-bold hover:bg-[#6EE7B7]' 
          : 'bg-[#ECFDF5] text-emerald-900 border-white hover:bg-emerald-50';
        break;
    }

    if (isSelected) {
      return `${base} ring-2 ring-[#1A1A1A] z-10 shadow-sm scale-[1.02]`;
    }
    return base;
  };

  return (
    <div className="bg-white p-6 border border-[#D1D1CB] shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-[#E6E6E1] pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">{title}</h3>
          <p className="text-[11px] text-[#888883] mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase font-mono">
          <span className="px-2 py-0.5 bg-[#ECFDF5] text-emerald-800 border border-[#A7F3D0]">Low</span>
          <span className="px-2 py-0.5 bg-[#FEF3C7] text-amber-900 border border-[#FDE68A]">Mod</span>
          <span className="px-2 py-0.5 bg-[#FFEDD5] text-orange-950 border border-[#FB923C]">High</span>
          <span className="px-2 py-0.5 bg-[#FEE2E2] text-red-900 border border-[#EF4444]">Extreme</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="min-w-[420px]">
          {/* Top Likelihood Indicator */}
          <div className="text-center font-bold text-[10px] uppercase tracking-[0.2em] text-[#888883] mb-2 font-mono">
            Likelihood (Kemungkinan) →
          </div>

          <div className="flex">
            {/* Left Y-Axis Label */}
            <div className="flex flex-col justify-center items-center pr-2">
              <span className="writing-mode-vertical -rotate-90 transform text-[10px] font-bold uppercase tracking-[0.2em] text-[#888883] whitespace-nowrap font-mono">
                Impact (Dampak) →
              </span>
            </div>

            {/* Grid Container */}
            <div className="flex-1">
              {/* Likelihood Column Headers */}
              <div className="grid grid-cols-5 gap-1 mb-1">
                {LIKELIHOOD_LABELS.map(l => (
                  <div key={l.level} className="text-center text-[10px] font-mono font-medium text-[#888883] truncate bg-[#F4F4F2] py-1 border-b border-white" title={l.label}>
                    {l.label}
                  </div>
                ))}
              </div>

              {/* Rows (Impact from 5 down to 1) */}
              <div className="space-y-1">
                {IMPACT_LABELS.map(imp => (
                  <div key={imp.level} className="flex items-center gap-1">
                    {/* Impact Row Label */}
                    <div className="w-24 text-[10px] font-mono text-[#888883] text-right pr-2 truncate bg-[#F4F4F2] py-3.5 border-r border-white" title={imp.label}>
                      {imp.label}
                    </div>

                    {/* 5 Columns for this Impact */}
                    <div className="flex-1 grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map(lh => {
                        const cell = getCellData(lh, imp.level);
                        const isSelected = selectedLikelihood === lh && selectedImpact === imp.level;
                        const cellColor = getCellColor(cell.rating, cell.count, isSelected);

                        return (
                          <button
                            key={lh}
                            onClick={() => onCellClick && onCellClick(lh, imp.level)}
                            className={`h-13 flex flex-col items-center justify-center p-1 border border-white transition-all cursor-pointer select-none group relative ${cellColor}`}
                            title={`Likelihood ${lh} × Impact ${imp.level} = Score ${cell.score} (${cell.rating}): ${cell.count} risks`}
                          >
                            <span className="text-lg font-serif italic leading-none">
                              {cell.count}
                            </span>
                            <span className="text-[9px] opacity-75 font-mono">
                              S:{cell.score}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
