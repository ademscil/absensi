import { describe, it, expect, vi } from 'vitest';
import {
  TARGET_REMOTE,
  TARGET_AUTHOR,
  OFFICE_ACCOUNT,
  configureLocalGit,
  checkActiveAccount,
  executePushWithSafety,
  switchGitHubAccount,
  checkDirtyWorktree,
} from '@/../scripts/gitSafety.js';

describe('Tier 2 - R6 Boundaries: Missing Config & Execution Failures', () => {
  it('T2-R6-01: Missing Git User Name / Email Handling', () => {
    const executedCommands = [];
    const mockExec = vi.fn((cmd) => {
      executedCommands.push(cmd);
      if (cmd.includes('remote.origin.url')) return 'https://github.com/ademscil/absensi.git\n';
      return '';
    });

    configureLocalGit(mockExec);

    expect(executedCommands).toContain('git config --local user.name "ademscil"');
    expect(executedCommands).toContain(
      'git config --local user.email "ademscil@users.noreply.github.com"'
    );
  });

  it('T2-R6-02: Remote URL Mismatch Correction', () => {
    const executedCommands = [];
    const mockExec = vi.fn((cmd) => {
      executedCommands.push(cmd);
      if (cmd.includes('remote.origin.url')) return 'https://github.com/someone/other.git\n';
      return '';
    });

    configureLocalGit(mockExec);

    expect(executedCommands).toContain(
      'git remote set-url origin https://github.com/ademscil/absensi.git'
    );
  });

  it('T2-R6-03: GitHub CLI Not Authenticated for ademscil', () => {
    const mockExec = vi.fn().mockImplementation((cmd) => {
      throw new Error('You are not logged into any GitHub hosts');
    });

    const status = checkActiveAccount(mockExec);
    expect(status.isValid).toBe(false);
  });

  it('T2-R6-04: Network Failure During Git Push', () => {
    const executedCommands = [];
    const mockExec = vi.fn((cmd) => {
      executedCommands.push(cmd);
      if (cmd.includes('remote.origin.url')) return 'https://github.com/ademscil/absensi.git\n';
      if (cmd.includes('git push')) {
        throw new Error('fatal: unable to access: Connection timed out');
      }
      return '';
    });

    const result = executePushWithSafety('main', mockExec);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Connection timed out');
    // Ensure account restoration still executed
    expect(executedCommands).toContain('gh auth switch --user AOP-B2B-DEV');
  });

  it('T2-R6-05: Process Interruption Handling (SIGINT)', () => {
    const executedCommands = [];
    const mockExec = vi.fn((cmd) => {
      executedCommands.push(cmd);
      if (cmd.includes('remote.origin.url')) return 'https://github.com/ademscil/absensi.git\n';
      if (cmd.includes('git push')) {
        const err = new Error('Process interrupted');
        err.signal = 'SIGINT';
        throw err;
      }
      return '';
    });

    const result = executePushWithSafety('main', mockExec);
    expect(result.success).toBe(false);
    expect(executedCommands).toContain('gh auth switch --user AOP-B2B-DEV');
  });

  it('T2-R6-06: Pre-Existing Dirty Tree Check', () => {
    const executedCommands = [];
    const mockExec = vi.fn((cmd) => {
      executedCommands.push(cmd);
      if (cmd.includes('status --porcelain')) return ' M src/App.jsx\n';
      return '';
    });

    const isDirty = checkDirtyWorktree(mockExec);
    expect(isDirty).toBe(true);
    expect(mockExec).toHaveBeenCalledWith('git status --porcelain', { encoding: 'utf-8' });

    // Verify clean worktree returns false
    const cleanExec = vi.fn(() => '');
    expect(checkDirtyWorktree(cleanExec)).toBe(false);
  });
});
