/**
 * SheetJS Excel (.xlsx) Recapitulation Export Utility
 * Adheres strictly to Excel Export Interface Contract in PROJECT.md
 */

import * as XLSX from 'xlsx';

/**
 * Sanitize SheetJS worksheet and workbook names
 * Strips forbidden characters: \ / ? * : [ ] and clamps length to 31 chars
 */
export function sanitizeSheetName(name) {
  if (!name || typeof name !== 'string') return 'Sheet1';
  const sanitized = name.replace(/[\\/?*:[\]]/g, ' ').trim();
  return (sanitized || 'Sheet1').substring(0, 31);
}

/**
 * Compute auto-fitted column widths for a SheetJS worksheet
 * @param {Array<Object>} rows
 * @param {Array<string>} headers
 * @returns {Array<{wch: number}>}
 */
function computeColumnWidths(rows, headers) {
  return headers.map((header) => {
    const maxDataLength = (rows || []).reduce((maxLen, row) => {
      const value = row && row[header] !== undefined && row[header] !== null
        ? String(row[header])
        : '';
      return Math.max(maxLen, value.length);
    }, header.length);
    return { wch: Math.min(48, Math.max(10, maxDataLength + 3)) };
  });
}

/**
 * Generate binary XLSX buffer and trigger client-side download
 * @param {Array<Object>} records - Attendance records
 * @param {Array<Object>} leaves - Leave requests
 * @param {string} tenantName - Tenant/company name
 * @returns {Blob|null}
 */
export function exportAttendanceToExcel(records = [], leaves = [], tenantName = 'Perusahaan') {
  const safeRecords = Array.isArray(records) ? records : [];
  const safeLeaves = Array.isArray(leaves) ? leaves : [];

  if (safeRecords.length === 0 && safeLeaves.length === 0) {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert('Tidak ada data untuk diekspor');
    }
    return null;
  }

  const cleanTenant = sanitizeSheetName(tenantName);
  const now = new Date();
  const dateStamp = now.toISOString().split('T')[0];

  const wb = XLSX.utils.book_new();

  // 1. Sheet 1 ("Data Absensi") — Comprehensive Indonesian tabular recap with auto-fit widths
  const dataAbsensiHeaders = [
    'No',
    'Tanggal',
    'NIK',
    'Nama Karyawan',
    'Departemen',
    'Waktu Masuk',
    'Waktu Pulang',
    'Status',
    'Tipe',
    'Lokasi/Geofence',
    'Catatan',
  ];

  const dataAbsensiRows = safeRecords.map((rec, index) => {
    const recType = rec.type || 'MASUK';
    const waktuMasuk = recType === 'PULANG' ? (rec.checkInTime || '-') : (rec.time || '-');
    const waktuPulang = recType === 'PULANG' ? (rec.time || '-') : (rec.checkOutTime || '-');
    const lokasi = rec.coordinates?.address ||
      (rec.coordinates && rec.coordinates.lat !== undefined ? `${rec.coordinates.lat}, ${rec.coordinates.lng}` : '-');
    const catatan = rec.notes || rec.reviewNotes || (rec.isSimulator ? 'Mode Simulator' : (rec.authHash ? `Hash: ${rec.authHash}` : '-'));

    return {
      No: index + 1,
      Tanggal: rec.date || '-',
      NIK: rec.userNik || rec.nik || '-',
      'Nama Karyawan': rec.userName || rec.name || '-',
      Departemen: rec.department || '-',
      'Waktu Masuk': waktuMasuk,
      'Waktu Pulang': waktuPulang,
      Status: rec.status || 'Tepat Waktu',
      Tipe: recType,
      'Lokasi/Geofence': lokasi,
      Catatan: catatan,
    };
  });

  const wsDataAbsensi = XLSX.utils.json_to_sheet(dataAbsensiRows, { header: dataAbsensiHeaders });
  wsDataAbsensi['!cols'] = computeColumnWidths(dataAbsensiRows, dataAbsensiHeaders);
  XLSX.utils.book_append_sheet(wb, wsDataAbsensi, sanitizeSheetName('Data Absensi'));

  // 2. Sheet 2 ("Ringkasan KPI") — Summary statistics
  const onTimeCount = safeRecords.filter(
    (r) => r.status === 'Tepat Waktu' || r.status === 'Hadir'
  ).length;
  const lateCount = safeRecords.filter((r) => r.status === 'Terlambat').length;
  const cutiCount =
    safeRecords.filter((r) => r.status === 'Cuti').length +
    safeLeaves.filter((l) => l.type === 'cuti').length;
  const izinCount =
    safeRecords.filter((r) => r.status === 'Izin').length +
    safeLeaves.filter((l) => l.type === 'izin').length;
  const sakitCount =
    safeRecords.filter((r) => r.status === 'Sakit').length +
    safeLeaves.filter((l) => l.type === 'sakit').length;

  const kpiHeaders = ['Metrik', 'Jumlah', 'Keterangan'];
  const kpiRows = [
    { Metrik: 'Total Catatan', Jumlah: safeRecords.length + safeLeaves.length, Keterangan: `${safeRecords.length} presensi, ${safeLeaves.length} perizinan` },
    { Metrik: 'Hadir Tepat Waktu', Jumlah: onTimeCount, Keterangan: 'Presensi tepat waktu / hadir' },
    { Metrik: 'Terlambat', Jumlah: lateCount, Keterangan: 'Presensi melewati batas masuk' },
    { Metrik: 'Cuti', Jumlah: cutiCount, Keterangan: 'Catatan & pengajuan cuti' },
    { Metrik: 'Izin', Jumlah: izinCount, Keterangan: 'Catatan & pengajuan izin' },
    { Metrik: 'Sakit', Jumlah: sakitCount, Keterangan: 'Catatan & pengajuan sakit' },
  ];

  const wsKpi = XLSX.utils.json_to_sheet(kpiRows, { header: kpiHeaders });
  wsKpi['!cols'] = computeColumnWidths(kpiRows, kpiHeaders);
  XLSX.utils.book_append_sheet(wb, wsKpi, sanitizeSheetName('Ringkasan KPI'));

  // 3. Sheet 3 ("Rekap Presensi") — Legacy/E2E compatibility sheet
  const presensiHeaders = [
    'No',
    'Tanggal',
    'Waktu',
    'NIK',
    'Nama Lengkap',
    'Departemen',
    'Tipe',
    'Status',
    'Lokasi',
    'Verifikasi Hash',
  ];
  const attendanceRows = safeRecords.map((rec, index) => ({
    No: index + 1,
    Tanggal: rec.date || '-',
    Waktu: rec.time || '-',
    NIK: rec.userNik || rec.nik || '-',
    'Nama Lengkap': rec.userName || rec.name || '-',
    Departemen: rec.department || '-',
    Tipe: rec.type || 'MASUK',
    Status: rec.status || 'Tepat Waktu',
    Lokasi: rec.coordinates?.address || (rec.coordinates ? `${rec.coordinates.lat}, ${rec.coordinates.lng}` : '-'),
    'Verifikasi Hash': rec.authHash || '-',
  }));

  const wsAttendances = XLSX.utils.json_to_sheet(attendanceRows, { header: presensiHeaders });
  wsAttendances['!cols'] = computeColumnWidths(attendanceRows, presensiHeaders);
  const presensiSheetName = sanitizeSheetName('Rekap Presensi');
  XLSX.utils.book_append_sheet(wb, wsAttendances, presensiSheetName);

  // 4. Sheet 4 ("Rekap Perizinan") — Leave requests sheet
  const leaveHeaders = [
    'No',
    'NIK',
    'Nama Lengkap',
    'Tipe Izin',
    'Tanggal Mulai',
    'Tanggal Selesai',
    'Durasi (Hari)',
    'Alasan',
    'Status',
    'Reviewer / Catatan HR',
  ];
  const leaveRows = safeLeaves.map((lve, index) => ({
    No: index + 1,
    NIK: lve.userNik || '-',
    'Nama Lengkap': lve.userName || '-',
    'Tipe Izin': lve.typeLabel || lve.type || 'Cuti',
    'Tanggal Mulai': lve.startDate || '-',
    'Tanggal Selesai': lve.endDate || '-',
    'Durasi (Hari)': lve.durationDays || 1,
    Alasan: lve.reason || '-',
    Status: lve.status === 'approved' ? 'Disetujui' : lve.status === 'rejected' ? 'Ditolak' : 'Menunggu Approval',
    'Reviewer / Catatan HR': lve.reviewNotes || '-',
  }));

  const wsLeaves = XLSX.utils.json_to_sheet(leaveRows, { header: leaveHeaders });
  wsLeaves['!cols'] = computeColumnWidths(leaveRows, leaveHeaders);
  const leaveSheetName = sanitizeSheetName('Rekap Perizinan');
  XLSX.utils.book_append_sheet(wb, wsLeaves, leaveSheetName);

  // 5. Write binary array
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // 6. Trigger download in browser environment
  if (typeof window !== 'undefined' && window.URL && window.document) {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${cleanTenant.replace(/\s+/g, '_')}_Rekap_Absensi_${dateStamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof window.URL.revokeObjectURL === 'function') {
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    }
  }

  return blob;
}
