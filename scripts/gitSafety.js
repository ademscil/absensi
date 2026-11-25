/**
 * Git Safety & Account Switching Routine (R6)
 * Validates remote origin, author config, and handles safe switching between ademscil and AOP-B2B-DEV.
 */

import { execSync } from 'child_process';

export const TARGET_REMOTE = 'https://github.com/ademscil/absensi.git';
export const TARGET_AUTHOR = 'ademscil';
export const TARGET_EMAIL = 'ademscil@users.noreply.github.com';
export const OFFICE_ACCOUNT = 'AOP-B2B-DEV';

/**
 * Check if the git worktree has unstaged or staged changes
 */
export function checkDirtyWorktree(exec = execSync) {
  try {
    const output = exec('git status --porcelain', { encoding: 'utf-8' });
    return (output || '').trim().length > 0;
  } catch (err) {
    return false;
  }
}

/**
 * Get current git remote origin URL
 */
export function getGitRemoteOrigin(exec = execSync) {
  try {
    const output = exec('git config --get remote.origin.url', { encoding: 'utf-8' });
    return (output || '').trim();
  } catch (err) {
    return null;
  }
}

/**
 * Get local git author name and email
 */
export function getLocalGitAuthor(exec = execSync) {
  try {
    const name = exec('git config --local user.name', { encoding: 'utf-8' }).trim();
    const email = exec('git config --local user.email', { encoding: 'utf-8' }).trim();
    return { name, email };
  } catch {
    return { name: null, email: null };
  }
}

/**
 * Configure local git author and remote origin
 */
export function configureLocalGit(exec = execSync) {
  const currentRemote = getGitRemoteOrigin(exec);
  if (!currentRemote) {
    exec(`git remote add origin ${TARGET_REMOTE}`);
  } else if (currentRemote !== TARGET_REMOTE) {
    exec(`git remote set-url origin ${TARGET_REMOTE}`);
  }

  exec(`git config --local user.name "${TARGET_AUTHOR}"`);
  exec(`git config --local user.email "${TARGET_EMAIL}"`);
  return true;
}

/**
 * Check active account in GitHub CLI
 */
export function checkActiveAccount(exec = execSync) {
  try {
    const statusOutput = exec('gh auth status', { encoding: 'utf-8' });
    if (statusOutput.includes(`Logged in to github.com account ${TARGET_AUTHOR}`) ||
        statusOutput.includes(`Logged in to github.com as ${TARGET_AUTHOR}`)) {
      return { isValid: true, account: TARGET_AUTHOR };
    }
    if (statusOutput.includes(`account ${OFFICE_ACCOUNT}`) ||
        statusOutput.includes(`as ${OFFICE_ACCOUNT}`)) {
      return { isValid: false, account: OFFICE_ACCOUNT };
    }
    return { isValid: false, account: 'unknown' };
  } catch (err) {
    return { isValid: false, error: err.message };
  }
}

/**
 * Switch GitHub CLI active account
 */
export function switchGitHubAccount(accountName, exec = execSync) {
  try {
    exec(`gh auth switch --user ${accountName}`);
    return true;
  } catch (err) {
    throw new Error(`Gagal berpindah ke akun ${accountName}: ${err.message}`);
  }
}

/**
 * Execute Git Push with fail-safe rollback to AOP-B2B-DEV
 */
export function executePushWithSafety(branch = 'main', exec = execSync) {
  // Pre-flight check
  configureLocalGit(exec);
  let switched = false;

  try {
    switchGitHubAccount(TARGET_AUTHOR, exec);
    switched = true;
    exec(`git push origin ${branch}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    // Fail-safe restoration
    try {
      switchGitHubAccount(OFFICE_ACCOUNT, exec);
    } catch (restoreErr) {
      console.warn(`Peringatan: Gagal merestorasi akun ke ${OFFICE_ACCOUNT}:`, restoreErr.message);
    }
  }
}
