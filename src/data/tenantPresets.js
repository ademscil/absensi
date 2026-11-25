/**
 * Multi-Tenant Presets - Smart Mobile Attendance System
 * Defines 4 distinct brand presets: Corporate, Pemerintah, Sekolah, Retail/F&B
 * Strictly adheres to TenantPreset Interface Contract in PROJECT.md
 */

export const TENANT_PRESETS = {
  corporate: {
    id: 'corporate',
    name: 'PT Nusantara Jaya Mandiri',
    category: 'Korporat Swasta',
    tagline: 'Transformasi Digital & Ketenagakerjaan Modern',
    logoSvg: `<svg width="48" height="48" class="w-full h-full max-w-full max-h-full object-contain block" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="corp-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stop-color="#3B82F6"/>
          <stop offset="1" stop-color="#1E40AF"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#corp-grad)"/>
      <path d="M14 34V20L24 14L34 20V34" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 34V26H28V34" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="24" cy="20" r="2.5" fill="#60A5FA"/>
    </svg>`,
    colors: {
      primary: '#1E40AF',
      secondary: '#0D9488',
      accent: '#3B82F6',
      bgGradient: 'linear-gradient(135deg, #0A0F1D 0%, #0F172A 50%, #070B14 100%)',
      cardBg: 'rgba(30, 41, 59, 0.7)'
    },
    labels: {
      idLabel: 'NIK',
      userLabel: 'Karyawan',
      deptLabel: 'Departemen'
    }
  },
  pemerintah: {
    id: 'pemerintah',
    name: 'Badan Layanan Pemerintahan',
    category: 'Pemerintah',
    tagline: 'Integritas, Akuntabilitas & Pelayanan Publik',
    logoSvg: `<svg width="48" height="48" class="w-full h-full max-w-full max-h-full object-contain block" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gov-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stop-color="#22C55E"/>
          <stop offset="1" stop-color="#15803D"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#gov-grad)"/>
      <path d="M24 11L13 16V24C13 30.5 17.7 36.5 24 38C30.3 36.5 35 30.5 35 24V16L24 11Z" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M24 19V29M19 24H29" stroke="#FEF08A" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    colors: {
      primary: '#15803D',
      secondary: '#D97706',
      accent: '#22C55E',
      bgGradient: 'linear-gradient(135deg, #042F2E 0%, #064E3B 50%, #022C22 100%)',
      cardBg: 'rgba(6, 78, 59, 0.65)'
    },
    labels: {
      idLabel: 'NIP',
      userLabel: 'Pegawai',
      deptLabel: 'Satuan Kerja'
    }
  },
  sekolah: {
    id: 'sekolah',
    name: 'Akademi Bangsa Indonesia',
    category: 'Sekolah',
    tagline: 'Mendidik Generasi Emas Berkarakter & Unggul',
    logoSvg: `<svg width="48" height="48" class="w-full h-full max-w-full max-h-full object-contain block" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="edu-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stop-color="#A855F7"/>
          <stop offset="1" stop-color="#7C3AED"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#edu-grad)"/>
      <path d="M12 18L24 12L36 18L24 24L12 18Z" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M16 22V29.5C16 32 20 34 24 34C28 34 32 32 32 29.5V22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M36 18V28" stroke="#F472B6" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    colors: {
      primary: '#7C3AED',
      secondary: '#EC4899',
      accent: '#A855F7',
      bgGradient: 'linear-gradient(135deg, #2E1065 0%, #3B0764 50%, #1E1B4B 100%)',
      cardBg: 'rgba(59, 7, 100, 0.65)'
    },
    labels: {
      idLabel: 'NUPTK',
      userLabel: 'Guru / Tenaga Pendidik',
      deptLabel: 'Jurusan / Bidang'
    }
  },
  retail: {
    id: 'retail',
    name: 'Kopi Senja & Kitchen',
    category: 'Retail / F&B',
    tagline: 'Pelayanan Cepat, Cita Rasa Memikat',
    logoSvg: `<svg width="48" height="48" class="w-full h-full max-w-full max-h-full object-contain block" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ret-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F97316"/>
          <stop offset="1" stop-color="#EA580C"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ret-grad)"/>
      <path d="M14 20H32V29C32 32.3137 29.3137 35 26 35H20C16.6863 35 14 32.3137 14 29V20Z" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M32 23H35C36.1046 23 37 23.8954 37 25C37 26.1046 36.1046 27 35 27H32" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M20 13V16M26 13V16" stroke="#FED7AA" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 37H36" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    colors: {
      primary: '#EA580C',
      secondary: '#B45309',
      accent: '#F97316',
      bgGradient: 'linear-gradient(135deg, #431407 0%, #7C2D12 50%, #290E05 100%)',
      cardBg: 'rgba(67, 20, 7, 0.65)'
    },
    labels: {
      idLabel: 'Crew ID',
      userLabel: 'Staff',
      deptLabel: 'Cabang'
    }
  }
};

export const DEFAULT_TENANT_ID = 'corporate';

/**
 * Get tenant preset by ID, falling back to corporate if not found
 * @param {string} id 
 * @returns {typeof TENANT_PRESETS['corporate']}
 */
export function getTenantPreset(id) {
  if (id && TENANT_PRESETS[id]) {
    return TENANT_PRESETS[id];
  }
  return TENANT_PRESETS[DEFAULT_TENANT_ID];
}

/**
 * Get list of all available tenant presets
 * @returns {Array<typeof TENANT_PRESETS['corporate']>}
 */
export function getAllTenantPresets() {
  return Object.values(TENANT_PRESETS);
}

/**
 * Get default corporate preset
 * @returns {typeof TENANT_PRESETS['corporate']}
 */
export function getDefaultTenant() {
  return TENANT_PRESETS[DEFAULT_TENANT_ID];
}
