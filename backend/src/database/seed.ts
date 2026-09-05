import bcrypt from 'bcryptjs';
import {
  RoleName,
  RiskRating,
  RiskResponse,
  RiskStatus,
  ControlType,
  ControlFrequency,
  EffectivenessLevel,
  ActionPlanPriority,
  ActionPlanStatus
} from '../../../shared/types.ts';
import { calculateRiskScore, calculateControlEffectiveness } from '../../../shared/risk-scoring.ts';

export interface DatabaseState {
  roles: any[];
  units: any[];
  risk_categories: any[];
  users: any[];
  risks: any[];
  controls: any[];
  action_plans: any[];
  notifications: any[];
  audit_logs: any[];
  approval_histories: any[];
  settings: Record<string, any>;
}

export function generateSeedData(): DatabaseState {
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Roles
  const roles = [
    { id: 1, name: 'ADMIN' as RoleName, description: 'Enterprise System Administrator with full configuration access' },
    { id: 2, name: 'RISK_MANAGEMENT' as RoleName, description: 'Risk Management Directorate - Reviewer, Approver, Enterprise Monitor' },
    { id: 3, name: 'RISK_OWNER' as RoleName, description: 'Business Unit Head / Process Owner - Creator, Assessor, Action Plan Owner' },
    { id: 4, name: 'MANAGEMENT' as RoleName, description: 'Executive Board / C-Level Management - Strategic Dashboard & Oversight' },
    { id: 5, name: 'AUDITOR' as RoleName, description: 'Internal / External Audit - Compliance Inspection and Audit Trail Viewer' }
  ];

  // 2. Units (5 Financial Services Directorates)
  const units = [
    { id: 1, code: 'DIR-DPB', name: 'Direktorat Pengembangan Bisnis', parent_unit_id: null, is_active: true },
    { id: 2, code: 'DIR-TEK', name: 'Direktorat Teknik', parent_unit_id: null, is_active: true },
    { id: 3, code: 'DIR-DMR', name: 'Direktorat Manajemen Risiko', parent_unit_id: null, is_active: true },
    { id: 4, code: 'DIR-KEU', name: 'Direktorat Keuangan', parent_unit_id: null, is_active: true },
    { id: 5, code: 'DIR-OPS', name: 'Direktorat Operasional', parent_unit_id: null, is_active: true }
  ];

  // 3. Risk Categories (12 standard financial enterprise categories)
  const risk_categories = [
    { id: 1, code: 'CAT-STR', name: 'Strategic', description: 'Risiko kegagalan pencapaian sasaran strategis perusahaan', is_active: true },
    { id: 2, code: 'CAT-OPS', name: 'Operational', description: 'Risiko kegagalan proses internal, manusia, atau sistem', is_active: true },
    { id: 3, code: 'CAT-CRD', name: 'Credit', description: 'Risiko gagal bayar atau penurunan kualitas debitur/counterparty', is_active: true },
    { id: 4, code: 'CAT-MKT', name: 'Market', description: 'Risiko pergerakan suku bunga, valuta asing, dan pasar modal', is_active: true },
    { id: 5, code: 'CAT-LIQ', name: 'Liquidity', description: 'Risiko ketidakmampuan memenuhi kewajiban likuiditas jangka pendek', is_active: true },
    { id: 6, code: 'CAT-LGL', name: 'Legal', description: 'Risiko tuntutan hukum atau kelemahan perikatan kontrak', is_active: true },
    { id: 7, code: 'CAT-CMP', name: 'Compliance', description: 'Risiko sanksi regulator atau ketidakpatuhan ketentuan OJK/BI', is_active: true },
    { id: 8, code: 'CAT-FRD', name: 'Fraud', description: 'Risiko kecurangan internal atau eksternal yang merugikan bank', is_active: true },
    { id: 9, code: 'CAT-CYB', name: 'IT/Cyber', description: 'Risiko serangan siber, kebocoran data, dan downtime infrastruktur', is_active: true },
    { id: 10, code: 'CAT-REP', name: 'Reputation', description: 'Risiko publikasi negatif atau penurunan kepercayaan stakeholder', is_active: true },
    { id: 11, code: 'CAT-FIN', name: 'Financial', description: 'Risiko kerugian pelaporan keuangan dan akuntansi modal', is_active: true },
    { id: 12, code: 'CAT-ESG', name: 'ESG', description: 'Risiko dampak lingkungan, sosial, dan tata kelola berkelanjutan', is_active: true }
  ];

  // 4. Users
  const users = [
    {
      id: 1,
      uuid: 'usr-admin-001',
      name: 'Ahmad Fauzi (Administrator)',
      email: 'admin@bankfinancial.com',
      password_hash: passwordHash,
      role_id: 1, // ADMIN
      unit_id: 3,
      manager_id: null,
      is_active: true,
      created_at: new Date('2026-01-01T08:00:00Z').toISOString()
    },
    {
      id: 2,
      uuid: 'usr-rm-002',
      name: 'Siti Rahmawati (Risk Management Officer)',
      email: 'risk.mgmt@bankfinancial.com',
      password_hash: passwordHash,
      role_id: 2, // RISK_MANAGEMENT
      unit_id: 3,
      manager_id: 1,
      is_active: true,
      created_at: new Date('2026-01-01T08:00:00Z').toISOString()
    },
    {
      id: 3,
      uuid: 'usr-owner-003',
      name: 'Budi Santoso (Head of Business Dev)',
      email: 'risk.owner@bankfinancial.com',
      password_hash: passwordHash,
      role_id: 3, // RISK_OWNER
      unit_id: 1,
      manager_id: 4,
      is_active: true,
      created_at: new Date('2026-01-01T08:00:00Z').toISOString()
    },
    {
      id: 4,
      uuid: 'usr-mgmt-004',
      name: 'Hendra Kusuma (Director of Risk & Strategy)',
      email: 'management@bankfinancial.com',
      password_hash: passwordHash,
      role_id: 4, // MANAGEMENT
      unit_id: 3,
      manager_id: null,
      is_active: true,
      created_at: new Date('2026-01-01T08:00:00Z').toISOString()
    },
    {
      id: 5,
      uuid: 'usr-audit-005',
      name: 'Dewi Lestari (Internal Audit Lead)',
      email: 'auditor@bankfinancial.com',
      password_hash: passwordHash,
      role_id: 5, // AUDITOR
      unit_id: 3,
      manager_id: null,
      is_active: true,
      created_at: new Date('2026-01-01T08:00:00Z').toISOString()
    },
    {
      id: 6,
      uuid: 'usr-tek-006',
      name: 'Rian Pratama (Head of Technology/IT)',
      email: 'it.owner@bankfinancial.com',
      password_hash: passwordHash,
      role_id: 3,
      unit_id: 2,
      manager_id: 4,
      is_active: true,
      created_at: new Date('2026-01-01T08:00:00Z').toISOString()
    },
    {
      id: 7,
      uuid: 'usr-ops-007',
      name: 'Maya Indah (Head of Branch Operations)',
      email: 'ops.owner@bankfinancial.com',
      password_hash: passwordHash,
      role_id: 3,
      unit_id: 5,
      manager_id: 4,
      is_active: true,
      created_at: new Date('2026-01-01T08:00:00Z').toISOString()
    }
  ];

  // 5. Risks Generation (At least 30 risks: 5 Low, 10 Moderate, 10 High, 5 Extreme)
  interface RiskSeedConfig {
    unit_id: number;
    owner_id: number;
    category_id: number;
    process: string;
    sub_process: string;
    event: string;
    desc: string;
    cause: string;
    impact_desc: string;
    in_l: number;
    in_i: number;
    res_l: number;
    res_i: number;
    response: RiskResponse;
    status: RiskStatus;
    justification?: string;
  }

  const rawRisks: RiskSeedConfig[] = [
    // 5 EXTREME RISKS (Score 17-25)
    {
      unit_id: 2, owner_id: 6, category_id: 9,
      process: 'Core Banking Infrastructure', sub_process: 'Data Center Resilience',
      event: 'Serangan Ransomware Terdistribusi pada Sistem Core Banking Utama',
      desc: 'Enkripsi data nasabah secara masif oleh kelompok ancaman siber internasional',
      cause: 'Zero-day vulnerability pada perimeter gateway belum teraplikasi patch darurat',
      impact_desc: 'Lumpuhnya transaksi perbankan nasional, potensi sanksi BI/OJK dan hilangnya reputasi',
      in_l: 4, in_i: 5, // Score 20 (EXTREME)
      res_l: 3, res_i: 4, // Score 12 (HIGH)
      response: 'REDUCE', status: 'MONITORING'
    },
    {
      unit_id: 4, owner_id: 3, category_id: 5,
      process: 'Treasury & ALM', sub_process: 'Liquidity Stress Management',
      event: 'Penarikan Dana Pihak Ketiga (DPK) Giro Korporasi Skala Besar Secara Simultan',
      desc: 'Krisis likuiditas mendadak akibat kepanikan pasar finansial',
      cause: 'Fluktuasi makroekonomi ekstrem dan penyebaran berita negatif di media sosial',
      impact_desc: 'Pelanggaran rasio LCR (Liquidity Coverage Ratio) dan risiko intervensi LPS/OJK',
      in_l: 4, in_i: 5, // Score 20 (EXTREME)
      res_l: 2, res_i: 4, // Score 8 (MODERATE)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 5, owner_id: 7, category_id: 8,
      process: 'Cash Management & Clearing', sub_process: 'High Value RTGS Transfer',
      event: 'Penyusupan Transaksi Fraud Otorisasi Ganda Sistem Kliring Nasional',
      desc: 'Pemalsuan perintah transfer bernilai ratusan miliar rupiah melalui rekayasa kredensial',
      cause: 'Kolusi oknum internal dengan sindikat kejahatan siber eksternal',
      impact_desc: 'Kerugian finansial langsung secara masif dan investigasi penegak hukum',
      in_l: 5, in_i: 4, // Score 20 (EXTREME)
      res_l: 2, res_i: 3, // Score 6 (MODERATE)
      response: 'REDUCE', status: 'MONITORING'
    },
    {
      unit_id: 1, owner_id: 3, category_id: 3,
      process: 'Commercial Lending', sub_process: 'Syndicated Loan Underwriting',
      event: 'Gagal Bayar Masif Debitur Sindikasi Sektor Energi Terbarukan',
      desc: 'Kredit macet (NPL) bernilai triliunan rupiah dari konsorsium debitur utama',
      cause: 'Penurunan harga komoditas global dan kelalaian analisa covenant kontraktual',
      impact_desc: 'Lonjakan NPL ratio melewati batas 5%, penurunan CAR (Capital Adequacy Ratio)',
      in_l: 5, in_i: 5, // Score 25 (EXTREME)
      res_l: 3, res_i: 4, // Score 12 (HIGH)
      response: 'REDUCE', status: 'MONITORING'
    },
    {
      unit_id: 2, owner_id: 6, category_id: 9,
      process: 'Mobile Banking App', sub_process: 'API Gateway & Open Banking',
      event: 'Kebocoran Data Pribadi (PII) 5 Juta Nasabah melalui API Open Finance',
      desc: 'Eksfiltrasi database nasabah yang beredar di forum dark web',
      cause: 'Broken Object Level Authorization (BOLA) pada endpoint API mitra fintech',
      impact_desc: 'Gugatan perdata UU PDP No. 27/2022, denda maksimal regulator, eksodus nasabah',
      in_l: 4, in_i: 5, // Score 20 (EXTREME)
      res_l: 2, res_i: 4, // Score 8 (MODERATE)
      response: 'REDUCE', status: 'APPROVED'
    },

    // 10 HIGH RISKS (Score 10-16)
    {
      unit_id: 4, owner_id: 3, category_id: 4,
      process: 'FX Trading & Derivatives', sub_process: 'Cross-Currency Swaps',
      event: 'Kerugian Nilai Tukar Akibat Devaluasi Tajam Mata Uang Emerging Market',
      desc: 'Kerugian posisi portofolio valuta asing melampaui batas toleransi risiko pasar',
      cause: 'Volatilitas geopolitik global dan keterlambatan eksekusi hedging stop-loss',
      impact_desc: 'Penyusutan laba operasional triwulanan secara signifikan',
      in_l: 4, in_i: 4, // Score 16 (HIGH)
      res_l: 2, res_i: 3, // Score 6 (MODERATE)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 5, owner_id: 7, category_id: 7,
      process: 'Anti-Money Laundering', sub_process: 'KYC & PEP Screening',
      event: 'Kelemahan Deteksi Transaksi Mencurigakan Politically Exposed Persons (PEP)',
      desc: 'Akun nasabah berisiko tinggi lolos dari pemantauan automated AML watchdog',
      cause: 'Threshold alerting mesin AML terlalu tinggi sehingga memicu false negative',
      impact_desc: 'Teguran tertulis dari PPATK dan audit investigatif kepatuhan',
      in_l: 3, in_i: 4, // Score 12 (HIGH)
      res_l: 2, res_i: 2, // Score 4 (LOW)
      response: 'REDUCE', status: 'MONITORING'
    },
    {
      unit_id: 2, owner_id: 6, category_id: 9,
      process: 'Cloud Infrastructure', sub_process: 'Multi-Cloud Orchestration',
      event: 'Downtime Layanan Payment Gateway Cloud Selama Lebih dari 4 Jam',
      desc: 'Ketidakmampuan memproses transaksi e-commerce dan QRIS merchant secara nasional',
      cause: 'Kegagalan failover otomatis ke secondary region akibat miskonfigurasi DNS',
      impact_desc: 'Denda SLA merchant, kehilangan pendapatan fee-based income, teguran BI',
      in_l: 3, in_i: 5, // Score 15 (HIGH)
      res_l: 2, res_i: 3, // Score 6 (MODERATE)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 3, owner_id: 2, category_id: 1,
      process: 'Enterprise Planning', sub_process: 'Digital Transformation Strategy',
      event: 'Keterlambatan Peluncuran Platform Next-Gen Wealth Management',
      desc: 'Peluncuran terlambat 9 bulan dari target waktu strategis Rencana Bisnis Bank (RBB)',
      cause: 'Kompleksitas integrasi arsitektur legacy dan pergantian vendor implementor',
      impact_desc: 'Kehilangan momentum pangsa pasar segmen nasabah HNWI ke bank kompetitor',
      in_l: 4, in_i: 3, // Score 12 (HIGH)
      res_l: 2, res_i: 3, // Score 6 (MODERATE)
      response: 'REDUCE', status: 'UNDER_REVIEW'
    },
    {
      unit_id: 5, owner_id: 7, category_id: 2,
      process: 'Branch Cash Operations', sub_process: 'Vault & ATM Cash Logistics',
      event: 'Kekurangan Persediaan Uang Tunai ATM pada Periode Libur Hari Raya',
      desc: 'Habisnya stok kas di 200+ unit ATM area metropolitan selama periode puncak mudik',
      cause: 'Prediksi peramalan machine learning keliru dan keterlambatan armada Cash-in-Transit (CIT)',
      impact_desc: 'Komplain nasabah viral di media sosial dan sentimen publik negatif',
      in_l: 3, in_i: 4, // Score 12 (HIGH)
      res_l: 2, res_i: 2, // Score 4 (LOW)
      response: 'REDUCE', status: 'MONITORING'
    },
    {
      unit_id: 1, owner_id: 3, category_id: 3,
      process: 'SME Lending', sub_process: 'Credit Scoring & Assessment',
      event: 'Peningkatan Rasio NPL Segmen UMKM Sektor Manufaktur Tekstil',
      desc: 'Lonjakan keterlambatan angsuran lebih dari 90 hari pada klaster debitur industri tekstil',
      cause: 'Dampak banjir produk impor murah dan kenaikan biaya bahan baku energi',
      impact_desc: 'Peningkatan pembentukan Cadangan Kerugian Penurunan Nilai (CKPN)',
      in_l: 4, in_i: 3, // Score 12 (HIGH)
      res_l: 3, res_i: 2, // Score 6 (MODERATE)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 2, owner_id: 6, category_id: 9,
      process: 'Third-Party Vendor Management', sub_process: 'SaaS Vendor Security Audit',
      event: 'Insiden Keamanan Siber pada Vendor Penyedia Layanan HR Cloud',
      desc: 'Data kepegawaian dan kompensasi internal terekspos akibat insiden pihak ketiga',
      cause: 'Vendor mengalami social engineering phishing pada level administrator mereka',
      impact_desc: 'Pelanggaran kerahasiaan internal dan potensi kebocoran data strategis',
      in_l: 3, in_i: 4, // Score 12 (HIGH)
      res_l: 2, res_i: 2, // Score 4 (LOW)
      response: 'TRANSFER', status: 'APPROVED'
    },
    {
      unit_id: 4, owner_id: 3, category_id: 6,
      process: 'Procurement & Contract', sub_process: 'Vendor Contract SLA',
      event: 'Sengketa Hukum Klausul Ganti Rugi Pengadaan Perangkat Keras Server',
      desc: 'Vendor menuntut pembatalan sepihak dan klaim kerugian di Badan Arbitrase',
      cause: 'Ambiguity dalam drafting klausul termination for convenience pada kontrak kerja sama',
      impact_desc: 'Pembekuan sementara operasional pengadaan server data center baru',
      in_l: 3, in_i: 4, // Score 12 (HIGH)
      res_l: 2, res_i: 2, // Score 4 (LOW)
      response: 'REDUCE', status: 'UNDER_REVIEW'
    },
    {
      unit_id: 5, owner_id: 7, category_id: 8,
      process: 'Customer Service & Contact Center', sub_process: 'Identity Verification & PIN Reset',
      event: 'Pengambilalihan Akun (Account Takeover) melalui Social Engineering SIM Swap',
      desc: 'Pelaku kejahatan berhasil membujuk agen contact center untuk mereset kredensial nasabah',
      cause: 'Kelemahan otentikasi berbasis pertanyaan keamanan statis (security questions)',
      impact_desc: 'Kerugian saldo nasabah prioritas dan tuntutan ganti rugi',
      in_l: 4, in_i: 4, // Score 16 (HIGH)
      res_l: 2, res_i: 2, // Score 4 (LOW)
      response: 'REDUCE', status: 'MONITORING'
    },
    {
      unit_id: 3, owner_id: 2, category_id: 12,
      process: 'Sustainable Finance', sub_process: 'Green Taxonomy Classification',
      event: 'Klaim Greenwashing Pembiayaan Proyek Pembangkit Tenaga Biomassa',
      desc: 'LSM lingkungan menuduh proyek yang dibiayai bank merusak hutan lindung',
      cause: 'Due diligence aspek Analisis Mengenai Dampak Lingkungan (AMDAL) kurang mendalam',
      impact_desc: 'Penurunan ESG rating perbankan dari lembaga pemeringkat internasional',
      in_l: 3, in_i: 4, // Score 12 (HIGH)
      res_l: 2, res_i: 2, // Score 4 (LOW)
      response: 'REDUCE', status: 'APPROVED'
    },

    // 10 MODERATE RISKS (Score 5-9)
    {
      unit_id: 1, owner_id: 3, category_id: 10,
      process: 'Marketing & Brand Strategy', sub_process: 'Campaign & Social Media',
      event: 'Salah Tafsir Konten Edukasi Finansial di Media Sosial Resmi Bank',
      desc: 'Materi kampanye memicu kontroversi netizen mengenai diskriminasi suku bunga',
      cause: 'Proses review materi publikasi oleh compliance internal terlewatkan sebelum rilis',
      impact_desc: 'Gelombang komentar negatif dan sentimen Twitter/X yang menurun',
      in_l: 3, in_i: 3, // Score 9 (MODERATE)
      res_l: 2, res_i: 2, // Score 4 (LOW)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 5, owner_id: 7, category_id: 2,
      process: 'Remittance & Foreign Inward', sub_process: 'SWIFT Message Processing',
      event: 'Keterlambatan Rekonsiliasi Transaksi Valas SWIFT Akhir Hari',
      desc: 'Data penyelesaian batch SWIFT tertunda 2 jam melewati cut-off time sistem kliring',
      cause: 'Antrian proses batch job database mengalami bottleneck I/O storage',
      impact_desc: 'Keterlambatan pengkreditan dana valuta asing ke rekening nasabah korporat',
      in_l: 3, in_i: 2, // Score 6 (MODERATE)
      res_l: 1, res_i: 2, // Score 2 (LOW)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 2, owner_id: 6, category_id: 9,
      process: 'Workplace Technology', sub_process: 'Employee Endpoint Protection',
      event: 'Infeksi Malware Kripto-Mining pada Laptop Karyawan Kantor Cabang',
      desc: 'Laptop operasional terinfeksi program penambang kripto tanpa izin',
      cause: 'Karyawan mengklik tautan unduhan bajakan di luar jaringan secure VPN',
      impact_desc: 'Penurunan performa komputer dan potensi backdoor jaringan cabang',
      in_l: 3, in_i: 2, // Score 6 (MODERATE)
      res_l: 1, res_i: 2, // Score 2 (LOW)
      response: 'REDUCE', status: 'MONITORING'
    },
    {
      unit_id: 4, owner_id: 3, category_id: 11,
      process: 'Financial Reporting', sub_process: 'Tax Compliance & Filing',
      event: 'Keterlambatan Pelaporan Pajak PPh Pasal 21 Cabang Pembantu',
      desc: 'Salah satu kantor cabang pembantu terlambat submit rekonsiliasi faktur pajak',
      cause: 'Pergantian staf akuntansi cabang yang belum menerima pelatihan sistem e-Faktur',
      impact_desc: 'Sanksi denda administrasi keterlambatan pelaporan pajak dari DJP',
      in_l: 2, in_i: 3, // Score 6 (MODERATE)
      res_l: 1, res_i: 2, // Score 2 (LOW)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 1, owner_id: 3, category_id: 1,
      process: 'Product Innovation', sub_process: 'Digital Savings Account',
      event: 'Tingkat Akuisisi Nasabah Tabungan Digital di Bawah Target 20%',
      desc: 'Pertumbuhan nomor rekening baru (CIF) aplikasi mobile banking tidak memenuhi KPI',
      cause: 'Fitur onboarding KYC biometric sering mengalami kegagalan pada ponsel spesifikasi rendah',
      impact_desc: 'Penurunan proyeksi perolehan dana murah CASA (Current & Saving Account)',
      in_l: 3, in_i: 3, // Score 9 (MODERATE)
      res_l: 2, res_i: 2, // Score 4 (LOW)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 5, owner_id: 7, category_id: 7,
      process: 'Consumer Credit Administration', sub_process: 'Document Archiving & Storage',
      event: 'Keterlambatan Pengembalian Sertifikat Agunan KPR yang Telah Lunas',
      desc: 'Nasabah yang telah melunasi pinjaman harus menunggu lebih dari 14 hari kerja',
      cause: 'Fisik dokumen tersimpan di fasilitas gudang arsip eksternal yang lambat merespon',
      impact_desc: 'Keluhan nasabah ke Lembaga Alternatif Penyelesaian Sengketa Sektor Jasa Keuangan (LAPS SJK)',
      in_l: 3, in_i: 2, // Score 6 (MODERATE)
      res_l: 1, res_i: 2, // Score 2 (LOW)
      response: 'REDUCE', status: 'MONITORING'
    },
    {
      unit_id: 2, owner_id: 6, category_id: 9,
      process: 'Database Administration', sub_process: 'Routine Database Indexing',
      event: 'Lonjakan Penggunaan CPU Database Server Saat Laporan Bulanan Dijalankan',
      desc: 'Query reporting analitik membebani instance database transaksi operasional',
      cause: 'Belum terpisahnya database transaksional (OLTP) dengan data warehouse (OLAP)',
      impact_desc: 'Respon aplikasi melambat 2-3 detik pada hari kerja pertama setiap bulan',
      in_l: 3, in_i: 3, // Score 9 (MODERATE)
      res_l: 1, res_i: 2, // Score 2 (LOW)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 4, owner_id: 3, category_id: 4,
      process: 'Fixed Income Investment', sub_process: 'Government Bond Portfolio',
      event: 'Penurunan Mark-to-Market Portofolio Surat Berharga Negara (SBN)',
      desc: 'Penurunan nilai wajar obligasi negara dalam kategori Available For Sale (AFS)',
      cause: 'Ekspektasi kenaikan suku bunga acuan Bank Indonesia sebesar 25 bps',
      impact_desc: 'Pengurangan nilai Other Comprehensive Income (OCI) pada neraca perbankan',
      in_l: 3, in_i: 3, // Score 9 (MODERATE)
      res_l: 2, res_i: 2, // Score 4 (LOW)
      response: 'ACCEPT', status: 'APPROVED',
      justification: 'Portofolio obligasi ditahan hingga jatuh tempo (held to maturity profile)'
    },
    {
      unit_id: 5, owner_id: 7, category_id: 2,
      process: 'Cheque & Giro Clearing', sub_process: 'Signature Verification',
      event: 'Penolakan Cek Nasabah Akibat Ketidaksesuaian Spesimen Tanda Tangan',
      desc: 'Sistem menolak warkat cek karena perbedaan visual guratan tanda tangan manual',
      cause: 'Nasabah belum memperbarui spesimen KTP elektronik terbaru di cabang pembuka',
      impact_desc: 'Ketidaknyamanan nasabah giro korporat dan waktu verifikasi manual tambahan',
      in_l: 3, in_i: 2, // Score 6 (MODERATE)
      res_l: 1, res_i: 2, // Score 2 (LOW)
      response: 'REDUCE', status: 'APPROVED'
    },
    {
      unit_id: 3, owner_id: 2, category_id: 7,
      process: 'Regulatory Reporting', sub_process: 'APOLO & OJK Data Submission',
      event: 'Kesalahan Validasi Skema XML Pelaporan Berkala APOLO ke OJK',
      desc: 'File data format pelaporan ditolak otomatis oleh engine validasi regulator',
      cause: 'Perubahan kamus data regulasi belum diakomodir oleh script ekstraksi IT',
      impact_desc: 'Pemberian status warning pelaporan dan kewajiban submit ulang dalam 24 jam',
      in_l: 2, in_i: 4, // Score 8 (MODERATE)
      res_l: 1, res_i: 2, // Score 2 (LOW)
      response: 'REDUCE', status: 'APPROVED'
    },

    // 5 LOW RISKS (Score 1-4)
    {
      unit_id: 1, owner_id: 3, category_id: 10,
      process: 'Office Stationery & Merchandise', sub_process: 'Corporate Gifts',
      event: 'Keterlambatan Distribusi Kalender dan Agenda Tahunan ke Kantor Cabang',
      desc: 'Pengiriman merchandise akhir tahun terlambat 5 hari kerja dari jadwal',
      cause: 'Kendala logistik kurir pihak ketiga pada musim libur tahun baru',
      impact_desc: 'Keluhan minor dari unit kerja cabang tanpa dampak finansial terukur',
      in_l: 2, in_i: 1, // Score 2 (LOW)
      res_l: 1, res_i: 1, // Score 1 (LOW)
      response: 'ACCEPT', status: 'CLOSED'
    },
    {
      unit_id: 5, owner_id: 7, category_id: 2,
      process: 'General Affairs', sub_process: 'Branch Electricity & Generator Maintenance',
      event: 'Peralihan Daya Listrik Genset Terlambat 15 Detik Saat Pemadaman PLN',
      desc: 'Automatic Transfer Switch (ATS) mengalami delay mekanik sesaat',
      cause: 'Relay kontaktor ATS membutuhkan kalibrasi pembersihan berkala',
      impact_desc: 'UPS berhasil menopang perangkat tanpa ada gangguan operasional perbankan',
      in_l: 2, in_i: 2, // Score 4 (LOW)
      res_l: 1, res_i: 1, // Score 1 (LOW)
      response: 'REDUCE', status: 'CLOSED'
    },
    {
      unit_id: 2, owner_id: 6, category_id: 9,
      process: 'IT Helpdesk', sub_process: 'Password Reset Ticket',
      event: 'Waktu Tunggu Tiket Reset Password Akun Internal Melebihi 30 Menit',
      desc: 'Karyawan menunggu approval manual reset password sistem internal',
      cause: 'Lonjakan tiket reset setelah kebijakan pergantian password 90 harian',
      impact_desc: 'Keterlambatan produktivitas staf internal yang bersifat temporer',
      in_l: 2, in_i: 1, // Score 2 (LOW)
      res_l: 1, res_i: 1, // Score 1 (LOW)
      response: 'REDUCE', status: 'CLOSED'
    },
    {
      unit_id: 4, owner_id: 3, category_id: 11,
      process: 'Petty Cash Management', sub_process: 'Branch Cash Voucher Reconciliation',
      event: 'Selisih Kas Kecil Kurang dari Rp 50.000 pada Rekonsiliasi Mingguan',
      desc: 'Perbedaan pembukuan nota pembelian materai dan konsumsi rapat cabang',
      cause: 'Nota struk fisik sobek dan belum sempat di-scan oleh staf administrasi',
      impact_desc: 'Disesuaikan melalui pencatatan koreksi petty cash tanpa materialitas',
      in_l: 2, in_i: 1, // Score 2 (LOW)
      res_l: 1, res_i: 1, // Score 1 (LOW)
      response: 'ACCEPT', status: 'CLOSED'
    },
    {
      unit_id: 1, owner_id: 3, category_id: 1,
      process: 'Market Research', sub_process: 'Customer Satisfaction Survey',
      event: 'Tingkat Respon Kuesioner Kepuasan Nasabah Cabang di Bawah 10%',
      desc: 'Partisipasi pengisian formulir survei melalui email rendah',
      cause: 'Jumlah pertanyaan kuesioner terlalu panjang (lebih dari 20 pertanyaan)',
      impact_desc: 'Sampel statistik riset pasar memerlukan penambahan sampling channel baru',
      in_l: 2, in_i: 2, // Score 4 (LOW)
      res_l: 1, res_i: 1, // Score 1 (LOW)
      response: 'ACCEPT', status: 'CLOSED'
    }
  ];

  const risks: any[] = [];
  const controls: any[] = [];
  const approval_histories: any[] = [];
  const audit_logs: any[] = [];

  rawRisks.forEach((cfg, idx) => {
    const seq = (idx + 1).toString().padStart(5, '0');
    const riskIdCode = `RSK-2026-${seq}`;
    const inherent = calculateRiskScore(cfg.in_l, cfg.in_i);
    const residual = calculateRiskScore(cfg.res_l, cfg.res_i);
    const riskDbId = idx + 1;

    risks.push({
      id: riskDbId,
      risk_id: riskIdCode,
      unit_id: cfg.unit_id,
      risk_owner_id: cfg.owner_id,
      risk_category_id: cfg.category_id,
      business_process: cfg.process,
      sub_process: cfg.sub_process,
      risk_event: cfg.event,
      risk_description: cfg.desc,
      risk_cause: cfg.cause,
      risk_impact_description: cfg.impact_desc,
      inherent_likelihood: cfg.in_l,
      inherent_impact: cfg.in_i,
      inherent_score: inherent.score,
      inherent_rating: inherent.rating,
      residual_likelihood: cfg.res_l,
      residual_impact: cfg.res_i,
      residual_score: residual.score,
      residual_rating: residual.rating,
      residual_justification: cfg.justification || null,
      risk_response: cfg.response,
      risk_response_justification: cfg.justification || (cfg.response === 'ACCEPT' && inherent.level >= 3 ? 'Approved by Board with capital allocation' : null),
      status: cfg.status,
      created_by: cfg.owner_id,
      created_at: new Date(Date.now() - (30 - idx) * 86400000).toISOString(),
      updated_at: new Date(Date.now() - (15 - Math.min(idx, 14)) * 86400000).toISOString()
    });

    // Generate Existing Control for each risk
    const ctlTypes: ControlType[] = ['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE'];
    const freqs: ControlFrequency[] = ['CONTINUOUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];
    const designEff: EffectivenessLevel = inherent.level >= 3 ? 'EFFECTIVE' : 'PARTIALLY_EFFECTIVE';
    const operEff: EffectivenessLevel = residual.level <= 2 ? 'EFFECTIVE' : 'PARTIALLY_EFFECTIVE';
    const effResult = calculateControlEffectiveness(designEff, operEff);

    controls.push({
      id: idx + 1,
      risk_id: riskDbId,
      control_id: `CTL-${(idx + 1).toString().padStart(3, '0')}`,
      control_name: `Prosedur Kontrol Operasional & Validasi ${cfg.sub_process}`,
      control_description: `Implementasi SOP otorisasi bertingkat, dual control, serta sistem monitoring otomatis 24/7.`,
      control_objective: `Memitigasi eksposur risiko ${cfg.event.substring(0, 40)} hingga ke batas toleransi risiko (Risk Appetite).`,
      control_type: ctlTypes[idx % 3],
      control_frequency: freqs[idx % 5],
      control_owner_id: cfg.owner_id,
      control_effectiveness: effResult.level,
      control_design_effectiveness: designEff,
      control_operating_effectiveness: operEff,
      evidence: `SOP-RCSA-REF-${idx + 1}.pdf & Log SIEM Q3/2026`,
      created_at: new Date(Date.now() - (28 - idx) * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    });

    // Approval history entry
    approval_histories.push({
      id: idx + 1,
      risk_id: riskDbId,
      user_id: cfg.status === 'APPROVED' || cfg.status === 'MONITORING' || cfg.status === 'CLOSED' ? 2 : cfg.owner_id,
      action: cfg.status === 'DRAFT' ? 'CREATE' : cfg.status === 'SUBMITTED' ? 'SUBMIT' : cfg.status === 'UNDER_REVIEW' ? 'SUBMIT' : 'APPROVE',
      comments: cfg.status === 'APPROVED' ? 'Telah ditinjau dan disetujui oleh Risk Management sesuai Risk Appetite Statement.' : 'Risk assessment diajukan untuk review berkala.',
      created_at: new Date(Date.now() - (20 - Math.min(idx, 19)) * 86400000).toISOString()
    });

    // Audit log
    audit_logs.push({
      id: audit_logs.length + 1,
      user_id: cfg.owner_id,
      entity: 'Risk',
      entity_id: riskIdCode,
      action: 'CREATE',
      field_name: 'status',
      old_value: null,
      new_value: cfg.status,
      ip_address: '192.168.10.45',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
      created_at: new Date(Date.now() - (29 - idx) * 86400000).toISOString()
    });
  });

  // 6. Action Plans (At least 20 action plans: 5 overdue, 5 completed, 10 in progress)
  const action_plans: any[] = [];
  const today = new Date();

  interface PlanConfig {
    risk_idx: number;
    plan: string;
    pic_id: number;
    priority: ActionPlanPriority;
    daysOffset: number; // positive = future, negative = past
    progress: number;
    status: ActionPlanStatus;
    remarks: string;
  }

  const rawPlans: PlanConfig[] = [
    // 5 OVERDUE ACTION PLANS (Target date in past, status OVERDUE, progress < 100)
    {
      risk_idx: 0, // RSK-2026-00001 (Ransomware)
      plan: 'Implementasi Immutable Air-Gapped Backup System dan EDR Endpoint Isolator',
      pic_id: 6, priority: 'CRITICAL', daysOffset: -16, progress: 65, status: 'OVERDUE',
      remarks: 'Tertunda karena pengiriman hardware storage dari vendor terlambat impor.'
    },
    {
      risk_idx: 1, // RSK-2026-00002 (Liquidity)
      plan: 'Penyusunan Contingency Funding Plan (CFP) Terintegrasi dengan Standby Line Bank Sentral',
      pic_id: 3, priority: 'HIGH', daysOffset: -10, progress: 50, status: 'OVERDUE',
      remarks: 'Menunggu finalisasi kesepakatan fasilitas bilateral repo dengan bank koresponden.'
    },
    {
      risk_idx: 2, // RSK-2026-00003 (RTGS Fraud)
      plan: 'Pemasangan Hardware Security Module (HSM) FIPS 140-3 Level 4 pada Gateway RTGS',
      pic_id: 7, priority: 'HIGH', daysOffset: -8, progress: 40, status: 'OVERDUE',
      remarks: 'Memerlukan sertifikasi kepatuhan eksternal dari BSSN.'
    },
    {
      risk_idx: 3, // RSK-2026-00004 (Credit Syndication)
      plan: 'Restrukturisasi dan Eksekusi Jaminan Hak Tanggungan Debitur Konsorsium Energi',
      pic_id: 3, priority: 'CRITICAL', daysOffset: -15, progress: 30, status: 'OVERDUE',
      remarks: 'Proses appraisal ulang aset tanah dan pabrik masih berlangsung di pengadilan niaga.'
    },
    {
      risk_idx: 4, // RSK-2026-00005 (API Privacy)
      plan: 'Penerapan API Security Gateway dengan Rate Limiting dan OAuth2 mTLS Mutual Authentication',
      pic_id: 6, priority: 'HIGH', daysOffset: -5, progress: 75, status: 'OVERDUE',
      remarks: 'Pengujian integrasi sandbox mitra fintech menemukan bug respon payload.'
    },

    // 5 COMPLETED ACTION PLANS (progress 100, completed)
    {
      risk_idx: 5,
      plan: 'Penyempurnaan Value-at-Risk (VaR) Model Menggunakan Metode Monte Carlo Simulation',
      pic_id: 3, priority: 'HIGH', daysOffset: -20, progress: 100, status: 'COMPLETED',
      remarks: 'Model telah lolos backtesting 250 hari bursa dan disahkan Komite Manajemen Risiko.'
    },
    {
      risk_idx: 6,
      plan: 'Revisi Threshold Watchdog AML untuk Transaksi PEP Menjadi Di Bawah Rp 50 Juta',
      pic_id: 7, priority: 'MEDIUM', daysOffset: -12, progress: 100, status: 'COMPLETED',
      remarks: 'Aturan alerting baru telah aktif di sistem produksi dan diverifikasi tim Kepatuhan.'
    },
    {
      risk_idx: 7,
      plan: 'Implementasi Cloud Failover Multi-Region Otomatis dengan RTO < 15 Menit',
      pic_id: 6, priority: 'HIGH', daysOffset: -5, progress: 100, status: 'COMPLETED',
      remarks: 'Uji simulasi disaster recovery berjalan sukses dengan downtime hanya 4 menit.'
    },
    {
      risk_idx: 20,
      plan: 'Pemberlakuan SOP Baru Review Publikasi Media Sosial oleh Legal & Compliance',
      pic_id: 3, priority: 'MEDIUM', daysOffset: -14, progress: 100, status: 'COMPLETED',
      remarks: 'SOP telah disosialisasikan dan terintegrasi dalam CMS portal berita korporat.'
    },
    {
      risk_idx: 25,
      plan: 'Penggantian Relay Kontaktor Otomatis Panel ATS Generator Gedung Kantor Pusat',
      pic_id: 7, priority: 'LOW', daysOffset: -7, progress: 100, status: 'COMPLETED',
      remarks: 'Penggantian suku cadang selesai dan lulus uji simulasi blackout PLN.'
    },

    // 10 IN PROGRESS ACTION PLANS (Upcoming deadlines, progress 10%-85%)
    {
      risk_idx: 8,
      plan: 'Akselerasi Uji Coba Integrasi API Wealth Management dengan Penyedia Data Pasar Modal',
      pic_id: 6, priority: 'HIGH', daysOffset: 14, progress: 45, status: 'IN_PROGRESS',
      remarks: 'Tahap pengujian User Acceptance Testing (UAT) modul reksadana dan obligasi ritel.'
    },
    {
      risk_idx: 9,
      plan: 'Penambahan Armada Mobil Kas Keliling dan Re-Stocking Otomatis Berbasis AI di 200 ATM',
      pic_id: 7, priority: 'MEDIUM', daysOffset: 7, progress: 70, status: 'IN_PROGRESS',
      remarks: 'Vendor CIT telah menambah 15 unit armada dan integrasi dashboard kas berjalan lancar.'
    },
    {
      risk_idx: 10,
      plan: 'Audit Khusus Portofolio Kredit UMKM Tekstil dan Penguatan Skema Penjaminan Jamkrindo',
      pic_id: 3, priority: 'HIGH', daysOffset: 21, progress: 35, status: 'IN_PROGRESS',
      remarks: 'Verifikasi lapangan telah mencakup 60 debitur dari target 120 debitur.'
    },
    {
      risk_idx: 11,
      plan: 'Pembaruan Klausa Kontrak Vendor Cloud Menegaskan Kewajiban Ganti Rugi dan Sertifikasi SOC 2',
      pic_id: 6, priority: 'MEDIUM', daysOffset: 10, progress: 50, status: 'IN_PROGRESS',
      remarks: 'Draft addendum kontrak sedang ditinjau divisi Legal korporat.'
    },
    {
      risk_idx: 12,
      plan: 'Penyelarasan Klausul Dispute Arbitrase BANI pada Seluruh Template Pengadaan IT',
      pic_id: 3, priority: 'MEDIUM', daysOffset: 30, progress: 20, status: 'IN_PROGRESS',
      remarks: 'Penyusunan standar kontrak baru bersama konsultan hukum eksternal.'
    },
    {
      risk_idx: 13,
      plan: 'Migrasi Sistem Otentikasi Contact Center Menjadi Voice Biometric dan Push Notification OTP',
      pic_id: 7, priority: 'HIGH', daysOffset: 3, progress: 80, status: 'IN_PROGRESS',
      remarks: 'Sistem voice biometrics telah terpasang, sedang tahap pilot project 10.000 nasabah.'
    },
    {
      risk_idx: 14,
      plan: 'Pelaksanaan Audit Lingkungan Pihak Ketiga Independen untuk Seluruh Portofolio Kredit Hijau',
      pic_id: 2, priority: 'HIGH', daysOffset: 45, progress: 15, status: 'IN_PROGRESS',
      remarks: 'Tender penunjukan lembaga audit independen internasional sedang berjalan.'
    },
    {
      risk_idx: 15,
      plan: 'Pemisahan Database Transaksional OLTP dengan Read-Only Replica untuk Modul Analitik',
      pic_id: 6, priority: 'MEDIUM', daysOffset: 12, progress: 60, status: 'IN_PROGRESS',
      remarks: 'Server replica Postgres telah siap dan sedang sinkronisasi data historical.'
    },
    {
      risk_idx: 16,
      plan: 'Implementasi Single Sign-On (SSO) Berbasis SAML 2.0 dan Multi-Factor Authentication FIDO2',
      pic_id: 6, priority: 'MEDIUM', daysOffset: 18, progress: 40, status: 'IN_PROGRESS',
      remarks: 'Integrasi dengan Active Directory Azure selesai, persiapan rollout bertahap.'
    },
    {
      risk_idx: 17,
      plan: 'Otomasi Pelaporan Data APOLO OJK Menggunakan Pipeline Data Validation Otomatis',
      pic_id: 2, priority: 'HIGH', daysOffset: 1, progress: 85, status: 'IN_PROGRESS',
      remarks: 'Validasi skema XML lolos 100% pada testing environment.'
    }
  ];

  rawPlans.forEach((p, idx) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + p.daysOffset);
    const planDbId = idx + 1;
    const riskDbId = p.risk_idx + 1;

    action_plans.push({
      id: planDbId,
      risk_id: riskDbId,
      action_plan: p.plan,
      pic_id: p.pic_id,
      priority: p.priority,
      target_date: targetDate.toISOString(),
      progress: p.progress,
      status: p.status,
      completion_date: p.status === 'COMPLETED' ? new Date(today.getTime() - 86400000 * 2).toISOString() : null,
      evidence: p.status === 'COMPLETED' ? `Laporan-Penyelesaian-AP-${planDbId}.pdf` : null,
      remarks: p.remarks,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    });

    // Create audit log for plan
    audit_logs.push({
      id: audit_logs.length + 1,
      user_id: p.pic_id,
      entity: 'ActionPlan',
      entity_id: `AP-${planDbId}`,
      action: p.status === 'OVERDUE' ? 'STATUS_CHANGE' : 'CREATE',
      field_name: 'status',
      old_value: p.status === 'OVERDUE' ? 'IN_PROGRESS' : null,
      new_value: p.status,
      ip_address: '192.168.10.45',
      user_agent: 'RCSA Scheduler Service / Web Console',
      created_at: new Date().toISOString()
    });
  });

  // 7. Seed Notifications Log (Sample recent alerts and reminders)
  const notifications: any[] = [
    {
      id: 1,
      risk_id: 1,
      action_plan_id: null,
      recipient_id: 2,
      recipient_email: 'risk.mgmt@bankfinancial.com',
      recipient_name: 'Siti Rahmawati (Risk Management Officer)',
      notification_type: 'RISK_HIGH_ALERT',
      subject: '[RCSA ALERT] EXTREME Risk – RSK-2026-00001',
      body: 'A new risk assessment with rating EXTREME has been submitted and requires review.',
      sent_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      status: 'SENT',
      error_message: null,
      notification_date: new Date(Date.now() - 25 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 2,
      risk_id: 1,
      action_plan_id: 1,
      recipient_id: 2,
      recipient_email: 'risk.mgmt@bankfinancial.com',
      recipient_name: 'Siti Rahmawati (Risk Management Officer)',
      notification_type: 'ESCALATION_7D',
      subject: '[RCSA ESCALATION LEVEL 3] RSK-2026-00001 – Implementasi Immutable Air-Gapped Backup System',
      body: 'Overdue mitigation action plan escalated to Risk Management (>7 days past target date).',
      sent_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      status: 'SENT',
      error_message: null,
      notification_date: new Date(Date.now() - 9 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 9 * 86400000).toISOString()
    },
    {
      id: 3,
      risk_id: 1,
      action_plan_id: 1,
      recipient_id: 4,
      recipient_email: 'management@bankfinancial.com',
      recipient_name: 'Hendra Kusuma (Director of Risk & Strategy)',
      notification_type: 'ESCALATION_14D',
      subject: '[RCSA EXECUTIVE ESCALATION] RSK-2026-00001 – Implementasi Immutable Air-Gapped Backup System',
      body: 'Executive escalation to Board/Management for critical mitigation overdue >14 days.',
      sent_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      status: 'SENT',
      error_message: null,
      notification_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 4,
      risk_id: 18,
      action_plan_id: 20,
      recipient_id: 2,
      recipient_email: 'risk.mgmt@bankfinancial.com',
      recipient_name: 'Siti Rahmawati (Risk Management Officer)',
      notification_type: 'ACTION_PLAN_H1',
      subject: '[RCSA URGENT H-1] RSK-2026-00018 – Otomasi Pelaporan Data APOLO OJK',
      body: 'Mitigation plan deadline is tomorrow.',
      sent_at: new Date().toISOString(),
      status: 'SENT',
      error_message: null,
      notification_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ];

  // 8. System Settings
  const settings = {
    risk_thresholds: {
      low: { min: 1, max: 4, color: '#10b981', label: 'LOW' },
      moderate: { min: 5, max: 9, color: '#f59e0b', label: 'MODERATE' },
      high: { min: 10, max: 16, color: '#f97316', label: 'HIGH' },
      extreme: { min: 17, max: 25, color: '#ef4444', label: 'EXTREME' }
    },
    reminders: {
      h7: true,
      h3: true,
      h1: true,
      due_date: true,
      overdue_interval_days: 3
    },
    escalations: {
      level2_manager_days: 1,
      level3_risk_mgmt_days: 7,
      level4_management_days: 14
    },
    email: {
      provider: 'console',
      smtp_host: 'smtp.mailtrap.io',
      smtp_port: 2525,
      smtp_user: '',
      from: 'rcsa-alert@bankfinancial.com'
    }
  };

  return {
    roles,
    units,
    risk_categories,
    users,
    risks,
    controls,
    action_plans,
    notifications,
    audit_logs,
    approval_histories,
    settings
  };
}
