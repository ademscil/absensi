import React, { useState, useMemo } from 'react';
import {
  Search,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  Clock,
  CalendarOff,
  Stethoscope,
  Filter,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext.jsx';
import { getAttendances, getLeaveRequests, getUsers } from '../../utils/storage.js';
import { exportAttendanceToExcel } from '../../utils/excelExport.js';
import { Badge } from '../common/Badge.jsx';

/**
 * AttendanceRekap - Admin HR Data Recapitulation & Excel Export Console
 * Aggregates attendance & leave records from storage with multi-criteria filtering,
 * KPI summary cards, responsive table, and SheetJS (.xlsx) export.
 */
export function AttendanceRekap({
  'data-testid': testId = 'attendance-rekap',
  className = '',
}) {
  const { currentTenant, labels } = useTenant();

  const [allRecords] = useState(() => getAttendances());
  const [allLeaves] = useState(() => getLeaveRequests());
  const [allUsers] = useState(() => getUsers());
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter attendance records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      // 1. Department
      if (departmentFilter !== 'ALL' && rec.department !== departmentFilter) {
        return false;
      }
      // 2. Status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Pulang') {
          if (rec.status !== 'Pulang' && rec.type !== 'PULANG') {
            return false;
          }
        } else if (rec.status !== statusFilter) {
          return false;
        }
      }
      // 3. Date Range
      if (startDateFilter && rec.date && rec.date < startDateFilter) {
        return false;
      }
      if (endDateFilter && rec.date && rec.date > endDateFilter) {
        return false;
      }
      // 4. Search query (name / NIK)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = rec.userName?.toLowerCase().includes(q);
        const matchNik = rec.userNik?.toLowerCase().includes(q);
        if (!matchName && !matchNik) return false;
      }
      return true;
    });
  }, [allRecords, departmentFilter, statusFilter, startDateFilter, endDateFilter, searchQuery]);

  // Filter leave requests using the same criteria
  const filteredLeaves = useMemo(() => {
    return allLeaves.filter((lve) => {
      if (departmentFilter !== 'ALL' && lve.department !== departmentFilter) {
        return false;
      }
      if (statusFilter !== 'ALL') {
        const normalizedStatus = statusFilter.toLowerCase();
        if (['cuti', 'izin', 'sakit'].includes(normalizedStatus)) {
          if (lve.type !== normalizedStatus) return false;
        } else {
          return false;
        }
      }
      if (startDateFilter && lve.endDate && lve.endDate < startDateFilter) {
        return false;
      }
      if (endDateFilter && lve.startDate && lve.startDate > endDateFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = lve.userName?.toLowerCase().includes(q);
        const matchNik = lve.userNik?.toLowerCase().includes(q);
        if (!matchName && !matchNik) return false;
      }
      return true;
    });
  }, [allLeaves, departmentFilter, statusFilter, startDateFilter, endDateFilter, searchQuery]);

  // Dynamic unique departments from records, users, and leaves
  const departmentOptions = useMemo(() => {
    const set = new Set();
    allRecords.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    allUsers.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    allLeaves.forEach((l) => {
      if (l.department) set.add(l.department);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allRecords, allUsers, allLeaves]);

  // Compute Summary KPI Metric Counters
  const summaryMetrics = useMemo(() => {
    let totalHadir = 0;
    let totalTerlambat = 0;
    let totalCuti = 0;
    let totalIzinSakit = 0;

    // Track (userNik + date) already counted as leave in attendance records to avoid double-counting
    const attendanceLeaveKeys = new Set();

    filteredRecords.forEach((rec) => {
      if (rec.status === 'Tepat Waktu' || rec.status === 'Hadir' || rec.status === 'Pulang') {
        totalHadir += 1;
      } else if (rec.status === 'Terlambat') {
        totalTerlambat += 1;
      } else if (rec.status === 'Cuti') {
        totalCuti += 1;
        attendanceLeaveKeys.add(`${rec.userNik || rec.userId}_${rec.date}`);
      } else if (rec.status === 'Izin' || rec.status === 'Sakit') {
        totalIzinSakit += 1;
        attendanceLeaveKeys.add(`${rec.userNik || rec.userId}_${rec.date}`);
      }
    });

    // Aggregate approved leaves not already represented in attendance records
    if (allRecords.length > 0 || statusFilter === 'Cuti' || statusFilter === 'Izin' || statusFilter === 'Sakit') {
      filteredLeaves.forEach((lve) => {
        if (lve.status !== 'approved') return;
        const key = `${lve.userNik || lve.userId}_${lve.startDate}`;
        if (attendanceLeaveKeys.has(key)) return;
        if (lve.type === 'cuti') {
          totalCuti += 1;
        } else if (lve.type === 'izin' || lve.type === 'sakit') {
          totalIzinSakit += 1;
        }
      });
    }

    return {
      totalHadir,
      totalTerlambat,
      totalCuti,
      totalIzinSakit,
    };
  }, [filteredRecords, filteredLeaves, allRecords.length, statusFilter]);

  const hasActiveFilters =
    departmentFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    Boolean(startDateFilter) ||
    Boolean(endDateFilter) ||
    Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setDepartmentFilter('ALL');
    setStatusFilter('ALL');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Tidak ada data untuk diekspor');
      }
      return;
    }
    exportAttendanceToExcel(filteredRecords, filteredLeaves, currentTenant.name);
  };

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const displayedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div data-testid={testId} className={`attendance-rekap space-y-5 ${className}`}>
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            Rekapitulasi Presensi & Kehadiran
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Agregasi presensi & perizinan lintas unit kerja {currentTenant.name}
          </p>
        </div>

        <button
          type="button"
          data-testid="btn-export-excel"
          onClick={handleExportExcel}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span data-testid="export-excel-btn" className="inline-flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            <span>Ekspor Excel (.xlsx)</span>
          </span>
        </button>
      </div>

      {/* Summary Metric Counters */}
      <div data-testid="recap-kpi-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          data-testid="rekap-kpi-hadir"
          className="p-3.5 sm:p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Hadir</span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1 block">
              {summaryMetrics.totalHadir}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>

        <div
          data-testid="rekap-kpi-terlambat"
          className="p-3.5 sm:p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Terlambat</span>
            <span className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-1 block">
              {summaryMetrics.totalTerlambat}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>

        <div
          data-testid="rekap-kpi-cuti"
          className="p-3.5 sm:p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Cuti</span>
            <span className="text-xl sm:text-2xl font-extrabold text-sky-400 mt-1 block">
              {summaryMetrics.totalCuti}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <CalendarOff className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>

        <div
          data-testid="rekap-kpi-izin-sakit"
          className="p-3.5 sm:p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Izin/Sakit</span>
            <span className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1 block">
              {summaryMetrics.totalIzinSakit}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Filter className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            <span>Filter Multi-Kriteria</span>
          </div>
          <div className="flex items-center gap-3">
            <span aria-live="polite" className="text-[11px] text-slate-400">
              Menampilkan <strong className="text-slate-200">{filteredRecords.length}</strong> dari {allRecords.length} data
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                data-testid="btn-clear-filters"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-sky-400 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Atur Ulang</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search by NIK or Employee Name */}
          <div>
            <label htmlFor="filter-search" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Cari {labels.idLabel} / Nama
            </label>
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="filter-search"
                type="search"
                data-testid="filter-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={`Cari ${labels.idLabel} atau Nama...`}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label htmlFor="filter-dept" className="block text-[11px] font-semibold text-slate-400 mb-1">
              {labels.deptLabel}
            </label>
            <select
              id="filter-dept"
              data-testid="filter-department"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua {labels.deptLabel}</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="filter-status" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Status Kehadiran
            </label>
            <select
              id="filter-status"
              data-testid="filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Tepat Waktu">Tepat Waktu</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Cuti">Cuti</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
              <option value="Pulang">Pulang</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="filter-start-date" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Mulai Tanggal
            </label>
            <input
              id="filter-start-date"
              type="date"
              data-testid="filter-start-date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="filter-end-date" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Sampai Tanggal
            </label>
            <input
              id="filter-end-date"
              type="date"
              data-testid="filter-end-date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Recapitulation Table */}
      <div className="rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="recap-table-caption"
          className="overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <table data-testid="recap-table" className="w-full text-left text-xs text-slate-200 min-w-[720px]">
            <caption id="recap-table-caption" className="sr-only">
              Tabel Rekapitulasi Presensi dan Kehadiran {labels.userLabel}
            </caption>
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/80 uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-3">No</th>
                <th scope="col" className="px-4 py-3">Tanggal & Waktu</th>
                <th scope="col" className="px-4 py-3">{labels.idLabel}</th>
                <th scope="col" className="px-4 py-3">Nama Lengkap</th>
                <th scope="col" className="px-4 py-3">{labels.deptLabel}</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Lokasi</th>
                <th scope="col" className="px-4 py-3">Verifikasi Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div data-testid="empty-recap-state" className="space-y-2">
                      <span className="text-3xl" aria-hidden="true">📑</span>
                      <p className="text-xs">
                        {allRecords.length === 0
                          ? 'Belum ada data presensi yang tercatat'
                          : 'Tidak ditemukan data yang sesuai dengan kriteria filter'}
                      </p>
                      {allRecords.length > 0 && (
                        <button
                          type="button"
                          data-testid="btn-reset-filters"
                          onClick={handleResetFilters}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-sky-400 border border-slate-700 hover:bg-slate-700 cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedRecords.map((rec, idx) => (
                  <tr key={rec.id} data-testid={`recap-row-${rec.id}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-white">{rec.date || '-'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rec.time ? `${rec.time} WIB` : '-'}
                        {rec.type ? ` • ${rec.type}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-sky-300 whitespace-nowrap">
                      {rec.userNik}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                      {rec.userName}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {rec.department}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge>{rec.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                      {rec.coordinates?.address || (rec.coordinates ? `${rec.coordinates.lat}, ${rec.coordinates.lng}` : '-')}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400 text-[11px] max-w-[140px] truncate">
                      {rec.authHash ? `#${rec.authHash}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            data-testid="pagination-bar"
            className="px-4 py-3 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400"
          >
            <span>
              Halaman {currentPage} dari {totalPages} ({filteredRecords.length} Data)
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Aggregated Leave & Permit Summary */}
      {allRecords.length > 0 && filteredLeaves.length > 0 && (
        <div
          data-testid="recap-leaves-section"
          className="p-4 rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Ringkasan Pengajuan Cuti & Perizinan ({filteredLeaves.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredLeaves.slice(0, 6).map((lve) => (
              <div
                key={lve.id}
                data-testid={`leave-recap-item-${lve.id}`}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white truncate">{lve.userName}</span>
                  <Badge
                    variant={
                      lve.status === 'approved'
                        ? 'success'
                        : lve.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {lve.status === 'approved'
                      ? 'Disetujui'
                      : lve.status === 'rejected'
                        ? 'Ditolak'
                        : 'Menunggu'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400">
                  {lve.typeLabel || lve.type} • {lve.startDate} s/d {lve.endDate} ({lve.durationDays || 1} hr)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default AttendanceRekap;
