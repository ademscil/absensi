/**
 * Storage Service - Smart Mobile Attendance System
 * Versioned LocalStorage persistence layer with Quota Guard and self-healing fallback.
 */

import {
  initialUsers,
  initialAttendances,
  initialLeaves,
  MOCK_PHOTO_PLACEHOLDER
} from '../data/initialMockData.js';
import { DEFAULT_TENANT_ID } from '../data/tenantPresets.js';

export const STORAGE_PREFIX = 'absensi_v1_';

export const STORAGE_KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  ATTENDANCES: `${STORAGE_PREFIX}attendances`,
  LEAVES: `${STORAGE_PREFIX}leaves`,
  TENANT: `${STORAGE_PREFIX}tenant`,
  CURRENT_USER: `${STORAGE_PREFIX}current_user`,
  SEEDED: `${STORAGE_PREFIX}seeded`
};

/**
 * Check if LocalStorage is available
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    const testKey = `${STORAGE_PREFIX}test_key`;
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempt to free up storage space when quota is exceeded
 * Compresses/clears old photos in stored attendances
 */
function pruneStorageForQuota() {
  try {
    const rawAttendances = localStorage.getItem(STORAGE_KEYS.ATTENDANCES);
    if (!rawAttendances) return false;

    const attendances = JSON.parse(rawAttendances);
    if (!Array.isArray(attendances) || attendances.length === 0) return false;

    // Prune photos from the bottom half (oldest records)
    let modified = false;
    const half = Math.floor(attendances.length / 2);
    for (let i = half; i < attendances.length; i++) {
      if (attendances[i].photoDataUrl && attendances[i].photoDataUrl.length > 500) {
        attendances[i].photoDataUrl = MOCK_PHOTO_PLACEHOLDER;
        modified = true;
      }
    }

    if (modified) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(attendances));
      return true;
    }

    // If still tight, trim oldest records beyond 50
    if (attendances.length > 50) {
      const trimmed = attendances.slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(trimmed));
      return true;
    }
  } catch (err) {
    console.warn('Storage pruning failed:', err);
  }
  return false;
}

/**
 * Quota-guarded safe storage setItem
 * @param {string} key 
 * @param {*} value 
 * @returns {boolean}
 */
export function safeSetItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // Check if error is QuotaExceededError
    const isQuotaError =
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.code === 22 ||
        error.code === 1014 ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

    if (isQuotaError) {
      console.warn(`LocalStorage quota exceeded while saving key "${key}". Attempting cleanup...`);
      const cleaned = pruneStorageForQuota();
      if (cleaned) {
        try {
          const serialized = JSON.stringify(value);
          localStorage.setItem(key, serialized);
          return true;
        } catch (retryError) {
          console.error(`Failed to write to LocalStorage after pruning:`, retryError);
        }
      }
    } else {
      console.error(`Error saving key "${key}" to LocalStorage:`, error);
    }
    return false;
  }
}

/**
 * Safe storage getItem with error handling and fallback
 * @param {string} key 
 * @param {*} defaultValue 
 * @returns {*}
 */
export function safeGetItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    try {
      return JSON.parse(item);
    } catch {
      // If defaultValue is provided and not a string, falling back to raw string causes crashes
      if (defaultValue !== null && typeof defaultValue !== 'string') {
        return defaultValue;
      }
      // If the raw string looks like malformed JSON (starts with { or [) and parse failed,
      // it was not intended as a raw string, so return defaultValue
      const trimmed = typeof item === 'string' ? item.trim() : '';
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return defaultValue;
      }
      return item;
    }
  } catch (error) {
    console.warn(`Error reading LocalStorage key "${key}", returning defaultValue:`, error);
    return defaultValue;
  }
}

// Aliases for compatibility
export const getStorageItem = safeGetItem;
export const setStorageItem = safeSetItem;

/**
 * Initialize storage with mock seed data if not yet seeded
 * @param {boolean} force - Force re-initialization
 */
export function initStorage(force = false) {
  if (!isStorageAvailable()) {
    console.warn('LocalStorage not available in current environment');
    return false;
  }

  const isSeeded = safeGetItem(STORAGE_KEYS.SEEDED, false);
  if (!isSeeded || force) {
    safeSetItem(STORAGE_KEYS.USERS, initialUsers);
    safeSetItem(STORAGE_KEYS.ATTENDANCES, initialAttendances);
    safeSetItem(STORAGE_KEYS.LEAVES, initialLeaves);
    safeSetItem(STORAGE_KEYS.TENANT, DEFAULT_TENANT_ID);
    safeSetItem(STORAGE_KEYS.SEEDED, true);
    return true;
  }
  return false;
}

/**
 * Users CRUD
 */
export function getUsers() {
  const users = safeGetItem(STORAGE_KEYS.USERS, initialUsers);
  return Array.isArray(users) ? users : initialUsers;
}

export function setUsers(users) {
  return safeSetItem(STORAGE_KEYS.USERS, users);
}

export function getUserById(id) {
  const users = getUsers();
  if (!Array.isArray(users)) return null;
  return users.find((u) => u.id === id) || null;
}

export function getUserByNik(nik) {
  const users = getUsers();
  if (!Array.isArray(users)) return null;
  return users.find((u) => u.nik?.toLowerCase() === nik?.toLowerCase()) || null;
}

/**
 * Attendances CRUD
 */
export function getAttendances() {
  const attendances = safeGetItem(STORAGE_KEYS.ATTENDANCES, initialAttendances);
  return Array.isArray(attendances) ? attendances : initialAttendances;
}

export function setAttendances(attendances) {
  return safeSetItem(STORAGE_KEYS.ATTENDANCES, attendances);
}

/**
 * Add a new attendance record (prepends to beginning)
 * @param {Object} record 
 * @returns {Object} The added record
 */
export function addAttendance(record) {
  const attendances = getAttendances();
  const safeAttendances = Array.isArray(attendances) ? attendances : [];
  const newRecord = {
    id: record.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: record.createdAt || new Date().toISOString(),
    ...record
  };
  const updated = [newRecord, ...safeAttendances];
  setAttendances(updated);
  return newRecord;
}

/**
 * Alias for addAttendance to satisfy both naming conventions
 */
export const saveAttendanceRecord = addAttendance;

/**
 * Leaves CRUD
 */
export function getLeaves() {
  const leaves = safeGetItem(STORAGE_KEYS.LEAVES, initialLeaves);
  return Array.isArray(leaves) ? leaves : initialLeaves;
}

export function setLeaves(leaves) {
  return safeSetItem(STORAGE_KEYS.LEAVES, leaves);
}

/**
 * Add a new leave request (prepends to beginning)
 * @param {Object} leaveRequest 
 * @returns {Object} The added leave request
 */
export function addLeave(leaveRequest) {
  const leaves = getLeaves();
  const safeLeaves = Array.isArray(leaves) ? leaves : [];
  const newLeave = {
    id: leaveRequest.id || `lve_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: leaveRequest.status || 'pending',
    submittedAt: leaveRequest.submittedAt || new Date().toISOString(),
    ...leaveRequest
  };
  const updated = [newLeave, ...safeLeaves];
  setLeaves(updated);
  return newLeave;
}

/**
 * Update an existing leave request by ID
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Object|null}
 */
export function updateLeave(id, updates) {
  const leaves = getLeaves();
  if (!Array.isArray(leaves)) return null;

  let updatedRecord = null;
  const updatedLeaves = leaves.map((l) => {
    if (l.id === id) {
      updatedRecord = { ...l, ...updates };
      return updatedRecord;
    }
    return l;
  });

  if (updatedRecord) {
    setLeaves(updatedLeaves);

    // If leave was approved and it is annual leave (cuti), deduct quota from user
    if (updates.status === 'approved' && updatedRecord.type === 'cuti') {
      const users = getUsers();
      if (Array.isArray(users)) {
        let matchingUpdatedQuota = null;
        const updatedUsers = users.map((u) => {
          if (u.id === updatedRecord.userId || u.nik === updatedRecord.userNik) {
            const remaining = Math.max(0, (u.annualLeaveRemaining || 0) - (updatedRecord.durationDays || 1));
            matchingUpdatedQuota = remaining;
            return { ...u, annualLeaveRemaining: remaining };
          }
          return u;
        });
        setUsers(updatedUsers);

        // Also update absensi_v1_current_user in LocalStorage if the approved user is the current active session user
        const curr = getCurrentUser();
        if (curr && (curr.id === updatedRecord.userId || curr.nik === updatedRecord.userNik)) {
          const newRemaining = matchingUpdatedQuota !== null
            ? matchingUpdatedQuota
            : Math.max(0, (curr.annualLeaveRemaining || 0) - (updatedRecord.durationDays || 1));
          setCurrentUser({
            ...curr,
            annualLeaveRemaining: newRemaining,
          });
        }
      }
    }
  }

  return updatedRecord;
}

/**
 * Aliases & contract helpers for Attendance and Leave
 */
export const saveAttendance = addAttendance;
export const getLeaveRequests = getLeaves;
export const saveLeaveRequest = addLeave;

/**
 * Update leave request status with reviewer details
 * @param {string} id 
 * @param {'pending'|'approved'|'rejected'} status 
 * @param {Object} reviewerInfo 
 * @returns {Object|null}
 */
export function updateLeaveRequestStatus(id, status, reviewerInfo = {}) {
  return updateLeave(id, {
    status,
    ...reviewerInfo,
  });
}

/**
 * Update user annual leave quota
 * @param {string} idOrNik 
 * @param {number} remainingQuota 
 * @returns {Object|null}
 */
export function updateUserLeaveQuota(idOrNik, remainingQuota) {
  const users = getUsers();
  if (!Array.isArray(users)) return null;
  let updatedUser = null;
  const updated = users.map((u) => {
    if (u.id === idOrNik || u.nik?.toLowerCase() === idOrNik?.toLowerCase()) {
      updatedUser = { ...u, annualLeaveRemaining: remainingQuota };
      return updatedUser;
    }
    return u;
  });
  if (updatedUser) {
    setUsers(updated);
    const curr = getCurrentUser();
    if (curr && (curr.id === updatedUser.id || curr.nik?.toLowerCase() === updatedUser.nik?.toLowerCase())) {
      setCurrentUser({
        ...curr,
        annualLeaveRemaining: remainingQuota,
      });
    }
  }
  return updatedUser;
}

/**
 * Tenant Storage
 */
export function getStoredTenant() {
  return safeGetItem(STORAGE_KEYS.TENANT, DEFAULT_TENANT_ID);
}

export function setStoredTenant(tenantId) {
  return safeSetItem(STORAGE_KEYS.TENANT, tenantId);
}

/**
 * Current User Session Storage
 */
export function getCurrentUser() {
  const user = safeGetItem(STORAGE_KEYS.CURRENT_USER, null);
  return (user && typeof user === 'object' && !Array.isArray(user)) ? user : null;
}

export function setCurrentUser(user) {
  return safeSetItem(STORAGE_KEYS.CURRENT_USER, user);
}

export function clearCurrentUser() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } catch (err) {
    console.warn('Error removing current user:', err);
  }
}

/**
 * Reset / Clear all application storage keys
 */
export function clearAllStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (err) {
    console.error('Error clearing all storage:', err);
    return false;
  }
}
