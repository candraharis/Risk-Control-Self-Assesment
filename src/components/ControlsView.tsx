import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { Control } from '../../shared/types.ts';
import {
  Search
} from 'lucide-react';

export const ControlsView: React.FC = () => {
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [effFilter, setEffFilter] = useState('');

  const fetchControls = async () => {
    try {
      setLoading(true);
      const data = await api.getControls();
      setControls(data);
    } catch (err) {
      console.error('Failed to load controls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
  }, []);

  const filteredControls = controls.filter(c => {
    if (search && !c.control_name.toLowerCase().includes(search.toLowerCase()) && !c.control_id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (typeFilter && c.control_type !== typeFilter) return false;
    if (effFilter && c.control_effectiveness !== effFilter) return false;
    return true;
  });

  const effectiveCount = controls.filter(c => c.control_effectiveness === 'EFFECTIVE').length;
  const partialCount = controls.filter(c => c.control_effectiveness === 'PARTIALLY_EFFECTIVE').length;
  const ineffectiveCount = controls.filter(c => c.control_effectiveness === 'INEFFECTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D1D1CB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">
              Enterprise Control Library
            </h2>
            <span className="text-[10px] bg-white border border-[#D1D1CB] text-[#1A1A1A] px-2 py-0.5 font-mono font-bold">
              {controls.length} Controls
            </span>
          </div>
          <p className="text-xs text-[#888883] mt-1 font-mono">
            Katalog kontrol internal perbankan, penilaian design &amp; operating effectiveness
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border-l-2 border-emerald-600 pl-4 py-2 bg-white border border-[#D1D1CB] shadow-xs">
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest font-mono">Effective Controls</p>
          <p className="text-3xl font-serif italic text-[#1A1A1A] mt-0.5">{effectiveCount.toString().padStart(2, '0')}</p>
          <p className="text-[10px] text-[#888883] font-mono mt-1">Design &amp; operating criteria satisfied</p>
        </div>

        <div className="border-l-2 border-[#F59E0B] pl-4 py-2 bg-white border border-[#D1D1CB] shadow-xs">
          <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest font-mono">Partially Effective</p>
          <p className="text-3xl font-serif italic text-[#1A1A1A] mt-0.5">{partialCount.toString().padStart(2, '0')}</p>
          <p className="text-[10px] text-[#888883] font-mono mt-1">Minor operational deficiency</p>
        </div>

        <div className="border-l-2 border-[#EF4444] pl-4 py-2 bg-white border border-[#D1D1CB] shadow-xs">
          <p className="text-[10px] font-bold text-red-900 uppercase tracking-widest font-mono">Ineffective Controls</p>
          <p className="text-3xl font-serif italic text-[#1A1A1A] mt-0.5">{ineffectiveCount.toString().padStart(2, '0')}</p>
          <p className="text-[10px] text-[#888883] font-mono mt-1">Remediation action required</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#D1D1CB] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#888883]" />
          <input
            type="text"
            placeholder="Search control name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] placeholder:text-[#888883] focus:outline-hidden focus:border-[#1A1A1A]"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A] cursor-pointer"
          >
            <option value="">All Control Types</option>
            <option value="PREVENTIVE">PREVENTIVE</option>
            <option value="DETECTIVE">DETECTIVE</option>
            <option value="CORRECTIVE">CORRECTIVE</option>
          </select>
        </div>

        <div>
          <select
            value={effFilter}
            onChange={e => setEffFilter(e.target.value)}
            className="w-full text-xs p-2 bg-white border border-[#D1D1CB] text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A] cursor-pointer"
          >
            <option value="">All Effectiveness Levels</option>
            <option value="EFFECTIVE">EFFECTIVE</option>
            <option value="PARTIALLY_EFFECTIVE">PARTIALLY EFFECTIVE</option>
            <option value="INEFFECTIVE">INEFFECTIVE</option>
          </select>
        </div>
      </div>

      {/* Controls Table */}
      <div className="bg-white border border-[#D1D1CB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-[#888883]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6321] mx-auto mb-2"></div>
            Loading controls catalog...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F4F2] border-b border-[#D1D1CB] text-[#888883] font-bold uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Control ID</th>
                  <th className="py-3 px-4">Control Name &amp; Objective</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4 text-center">Design</th>
                  <th className="py-3 px-4 text-center">Operating</th>
                  <th className="py-3 px-4 text-center">Calculated Effectiveness</th>
                  <th className="py-3 px-4">Evidence / SOP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E6E1]">
                {filteredControls.map(c => (
                  <tr key={c.id} className="hover:bg-[#F4F4F2]/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1A1A1A] whitespace-nowrap">{c.control_id}</td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-serif italic text-sm text-[#1A1A1A]">{c.control_name}</div>
                      <div className="text-[11px] text-[#888883] line-clamp-1 mt-0.5 font-mono">{c.control_objective || c.control_description}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#1A1A1A]">{c.control_type}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#888883] font-mono text-[11px]">{c.control_frequency}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap text-[10px] font-mono font-semibold">{c.control_design_effectiveness}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap text-[10px] font-mono font-semibold">{c.control_operating_effectiveness}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 font-mono font-bold text-[10px] border ${
                        c.control_effectiveness === 'EFFECTIVE'
                          ? 'bg-[#ECFDF5] text-emerald-900 border-[#A7F3D0]'
                          : c.control_effectiveness === 'PARTIALLY_EFFECTIVE'
                          ? 'bg-[#FEF3C7] text-amber-900 border-[#FDE68A]'
                          : 'bg-[#FEE2E2] text-red-900 border-[#EF4444]'
                      }`}>
                        {c.control_effectiveness}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#888883] max-w-xs truncate text-[11px] font-mono">
                      {c.evidence || 'SOP Document'}
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
