/**
 * Canvas Watermark Compositor & Photo Compressor
 * Adheres strictly to Canvas Watermark Pipeline Contract in PROJECT.md
 */

/**
 * Generate a 12-character pseudo-random / content-derived verification hash
 */
export function generateAuthHash(nik, timestamp, coords) {
  const seed = `${nik}_${timestamp}_${coords?.lat || 0}_${coords?.lng || 0}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const tail = Math.abs((hash * 31) | 0).toString(16).padStart(4, '0');
  return (hex + tail).substring(0, 12).toUpperCase();
}

/**
 * Format Date to Indonesian WIB Format
 */
export function getWIBDateTimeString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dayName = days[date.getDay()];
  const d = pad(date.getDate());
  const monthName = months[date.getMonth()];
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return {
    dateStr: `${d}/${m}/${y}`,
    timeStr: `${hh}:${mm}:${ss} WIB`,
    fullFormatted: `${dayName}, ${d} ${monthName} ${y} • ${hh}:${mm}:${ss} WIB`,
  };
}

/**
 * Stamps attendance verification watermark onto video frame and downscales to quota-safe JPEG.
 * @param {HTMLVideoElement | HTMLCanvasElement} sourceMedia 
 * @param {Object} metadata 
 * @returns {Promise<string>} Compressed Base64 JPEG Data URL
 */
export async function stampAttendanceWatermark(sourceMedia, metadata = {}) {
  const targetWidth = 640;
  let sourceWidth = 640;
  let sourceHeight = 480;

  if (sourceMedia) {
    if (sourceMedia.videoWidth) {
      sourceWidth = sourceMedia.videoWidth;
      sourceHeight = sourceMedia.videoHeight || 480;
    } else if (sourceMedia.width) {
      sourceWidth = sourceMedia.width;
      sourceHeight = sourceMedia.height || 480;
    }
  }

  const aspectRatio = sourceHeight / sourceWidth;
  const targetHeight = Math.round(targetWidth * (aspectRatio || 0.75));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to acquire 2D canvas rendering context.');
  }

  // 1. Draw source video/canvas frame
  let drawn = false;
  if (sourceMedia && (sourceMedia.nodeType === 1 || typeof sourceMedia.getContext === 'function')) {
    try {
      ctx.drawImage(sourceMedia, 0, 0, targetWidth, targetHeight);
      drawn = true;
    } catch {
      drawn = false;
    }
  }

  if (!drawn) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // 2. Prepare Metadata Strings
  const now = new Date();
  const { dateStr, timeStr } = getWIBDateTimeString(now);
  const meta = metadata || {};
  const nikLabel = meta.idLabel || 'NIK';
  const nik = meta.nik || 'UNKNOWN';
  const name = meta.name || 'Anonymous';
  const tenantName = meta.tenantName || 'Absensi Digital';
  const department = meta.department || '-';
  const status = meta.status || 'Tepat Waktu';
  const type = meta.type || 'MASUK';
  const coords = meta.coords;

  let gpsText = 'Lokasi GPS Tidak Terdeteksi (Mode Darurat)';
  if (coords && (coords.lat !== 0 || coords.lng !== 0) && coords.lat && coords.lng) {
    const latStr = Number(coords.lat).toFixed(4);
    const lngStr = Number(coords.lng).toFixed(4);
    gpsText = `GPS: ${latStr}, ${lngStr}${coords.address ? ` (${coords.address})` : ''}`;
  }

  const authHash = generateAuthHash(nik, now.getTime(), coords);

  // 3. Render Semi-transparent Watermark Bottom Banner
  const bannerHeight = 120;
  const bannerY = targetHeight - bannerHeight;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(0, bannerY, targetWidth, bannerHeight);

  // Border Accent Line with gradient
  const accentGrad = ctx.createLinearGradient(0, bannerY, targetWidth, bannerY);
  accentGrad.addColorStop(0, '#3b82f6');
  accentGrad.addColorStop(0.5, '#60a5fa');
  accentGrad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, bannerY, targetWidth, 3);

  // 4. Stamped Texts
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';

  // Header Line: Tenant & WIB Timestamp
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(tenantName, 16, bannerY + 10);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`${dateStr} ${timeStr}`, targetWidth - 220, bannerY + 10);

  // Employee Identity Line
  ctx.fillStyle = '#f8fafc';
  // Check text length for auto-scaling
  let nameFontSize = 14;
  if (name.length > 35) {
    nameFontSize = 11;
  } else if (name.length > 25) {
    nameFontSize = 12;
  }
  ctx.font = `bold ${nameFontSize}px sans-serif`;
  const identityText = `${nikLabel}: ${nik} | Nama: ${name}`;
  ctx.fillText(identityText, 16, bannerY + 36);

  // Status & Dept Line
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Status: ${status} (${type}) | Dept: ${department}`, 16, bannerY + 60);

  // GPS Location Line
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  const truncatedGps = gpsText.length > 80 ? gpsText.substring(0, 77) + '...' : gpsText;
  ctx.fillText(truncatedGps, 16, bannerY + 82);

  // Anti-Spoof Auth Hash in bottom right corner
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`AUTH: #${authHash}`, targetWidth - 160, bannerY + 84);

  ctx.restore();

  // 5. Downscale & compress to JPEG quality 0.7
  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
  return compressedDataUrl;
}
