import React, { useState } from 'react';
import { api } from '../lib/api.ts';
import {
  Play,
  CheckCircle2,
  Clock,
  RotateCcw,
  Mail
} from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  const [runningScheduler, setRunningScheduler] = useState(false);
  const [schedulerOutput, setSchedulerOutput] = useState<any | null>(null);
  const [resettingSeed, setResettingSeed] = useState(false);
  const [message, setMessage] = useState('');

  const handleRunScheduler = async () => {
    try {
      setRunningScheduler(true);
      setMessage('');
      const res = await api.runScheduler();
      setSchedulerOutput(res);
      setMessage('Daily scheduler engine executed successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Scheduler failed');
    } finally {
      setRunningScheduler(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset database to clean enterprise seed data? All custom data will be restored to default.')) return;
    try {
      setResettingSeed(true);
      await api.resetSeed();
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setResettingSeed(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="border-b border-[#D1D1CB] pb-4">
        <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">
          Enterprise System Settings &amp; Automated Scheduler
        </h2>
        <p className="text-xs text-[#888883] mt-1 font-mono">
          Konfigurasi backend engine, cron scheduler, pengiriman notifikasi, dan reset data simulasi perbankan
        </p>
      </div>

      {/* Daily Scheduler Execution Card */}
      <div className="bg-white border border-[#D1D1CB] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CB]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
                Automated Daily Scheduler (Overdue &amp; Escalation Engine)
              </h3>
              <p className="text-xs text-[#888883] font-serif italic mt-1">
                Jadwal otomatis harian pada jam 08:00 WIB (cron: <code className="font-mono text-[#1A1A1A]">0 8 * * *</code>). Pemicu manual tersedia di bawah untuk pengujian cepat.
              </p>
            </div>
          </div>

          <button
            id="btn-trigger-scheduler"
            disabled={runningScheduler}
            onClick={handleRunScheduler}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>{runningScheduler ? 'Scanning...' : 'Run Scheduler Now'}</span>
          </button>
        </div>

        {message && (
          <div className="p-3 bg-[#ECFDF5] text-emerald-900 border border-[#A7F3D0] text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <span>{message}</span>
          </div>
        )}

        {schedulerOutput && (
          <div className="p-4 bg-[#1A1A1A] text-[#E6E6E1] border border-white/10 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-[#FF6321]">SCHEDULER SCAN RESULTS:</span>
              <span className="text-[#888883] text-[11px]">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/5 p-3 border border-white/5">
                <div className="text-2xl font-serif italic text-[#EF4444]">{schedulerOutput.overdueUpdated}</div>
                <div className="text-[10px] text-[#888883] uppercase tracking-wider mt-1">Overdue Updated</div>
              </div>
              <div className="bg-white/5 p-3 border border-white/5">
                <div className="text-2xl font-serif italic text-[#38BDF8]">{schedulerOutput.remindersSent}</div>
                <div className="text-[10px] text-[#888883] uppercase tracking-wider mt-1">Reminders Sent</div>
              </div>
              <div className="bg-white/5 p-3 border border-white/5">
                <div className="text-2xl font-serif italic text-[#F59E0B]">{schedulerOutput.escalationsSent}</div>
                <div className="text-[10px] text-[#888883] uppercase tracking-wider mt-1">Escalations Sent</div>
              </div>
            </div>
            {schedulerOutput.details && schedulerOutput.details.length > 0 && (
              <div className="mt-2 text-[11px] text-[#888883] space-y-1">
                {schedulerOutput.details.map((d: string, idx: number) => (
                  <div key={idx}>• {d}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-[#F4F4F2] border border-[#D1D1CB] text-xs text-[#1A1A1A] space-y-1 font-mono">
          <div className="font-bold uppercase tracking-wider text-[#888883] text-[10px] mb-1">Logika Aturan Eskalasi Keterlambatan:</div>
          <div>1. <strong>Reminder H-7, H-3, H-1:</strong> Mengingatkan PIC bahwa target waktu jatuh tempo mendekat.</div>
          <div>2. <strong>Due Date (Hari H):</strong> Notifikasi target penyelesaian hari ini.</div>
          <div>3. <strong>Overdue &gt; 7 Hari (Level 3):</strong> Eskalasi otomatis terkirim ke Risk Management Directorate.</div>
          <div>4. <strong>Overdue &gt; 14 Hari (Level 4):</strong> Eskalasi otomatis terkirim ke Executive Board / C-Level Management.</div>
          <div>5. <strong>Idempotency:</strong> Sistem mencegah pengiriman duplikat pada hari yang sama.</div>
        </div>
      </div>

      {/* Email Provider Info */}
      <div className="bg-white border border-[#D1D1CB] p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CB]">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
              Email Notification Infrastructure
            </h3>
            <p className="text-xs text-[#888883] font-mono">
              Provider aktif: Console fallback / SMTP / Resend
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-[#F4F4F2] border border-[#D1D1CB] text-xs text-[#1A1A1A] leading-relaxed font-serif italic">
          Sistem mendukung <strong>SMTP</strong> (misal Office365/Gmail/Sendgrid) dan <strong>Resend API</strong>. Jika kredensial belum diisi di <code className="font-mono text-[11px]">.env</code>, sistem beralih secara aman ke <strong>Console / In-Memory Mock Provider</strong>, mencatat seluruh pengiriman ke tabel <code className="font-mono text-[11px]">NotificationLog</code> agar workflow aplikasi tetap berfungsi 100% tanpa error eksternal.
        </div>
      </div>

      {/* Database Reset to Seed */}
      <div className="bg-white border border-[#D1D1CB] p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FEE2E2] text-[#EF4444] border border-[#EF4444]">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-red-900">
                Reset Clean Enterprise Seed Data
              </h3>
              <p className="text-xs text-[#888883] font-serif italic">
                Kembalikan data risiko, kontrol, rencana aksi, unit kerja, dan akun uji coba ke kondisi awal pabrik.
              </p>
            </div>
          </div>

          <button
            disabled={resettingSeed}
            onClick={handleResetSeed}
            className="px-4 py-2 bg-[#EF4444] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {resettingSeed ? 'Resetting...' : 'Reset to Seed'}
          </button>
        </div>
      </div>
    </div>
  );
};
