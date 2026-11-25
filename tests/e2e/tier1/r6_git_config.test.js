import { describe, it, expect, vi } from 'vitest';
import {
  getGitRemoteOrigin,
  getLocalGitAuthor,
  checkActiveAccount,
  switchGitHubAccount,
  executePushWithSafety,
} from '@/../scripts/gitSafety.js';

describe('Tier 1 - R6: Git Repository Remote & Author Verification', () => {
  it('T1-R6-01: Git Remote Origin Validation', () => {
    const mockExec = vi.fn().mockReturnValue('https://github.com/ademscil/absensi.git\n');
    const remote = getGitRemoteOrigin(mockExec);

    expect(remote).toBe('https://github.com/ademscil/absensi.git');
    expect(mockExec).toHaveBeenCalledWith('git config --get remote.origin.url', expect.any(Object));
  });

  it('T1-R6-02: Local Git Author Configuration', () => {
    const mockExec = vi.fn((cmd) => {
      if (cmd.includes('user.name')) return 'ademscil\n';
      if (cmd.includes('user.email')) return 'ademscil@users.noreply.github.com\n';
      return '';
    });

    const author = getLocalGitAuthor(mockExec);
    expect(author.name).toBe('ademscil');
    expect(author.email).toBe('ademscil@users.noreply.github.com');
  });

  it('T1-R6-03: Pre-Push Account Pre-Flight Check', () => {
    const mockExec = vi.fn().mockReturnValue(
      'github.com\n  ✓ Logged in to github.com account ademscil (/home/.config/gh/hosts.yml)\n'
    );

    const check = checkActiveAccount(mockExec);
    expect(check.isValid).toBe(true);
    expect(check.account).toBe('ademscil');
  });

  it('T1-R6-04: Account Switching Routine Execution to ademscil', () => {
    const mockExec = vi.fn().mockReturnValue('');

    const switched = switchGitHubAccount('ademscil', mockExec);
    expect(switched).toBe(true);
    expect(mockExec).toHaveBeenCalledWith('gh auth switch --user ademscil');
  });

  it('T1-R6-05: Post-Push Account Restoration to AOP-B2B-DEV', () => {
    const executedCommands = [];
    const mockExec = vi.fn((cmd) => {
      executedCommands.push(cmd);
      if (cmd.includes('remote.origin.url')) return 'https://github.com/ademscil/absensi.git\n';
      return '';
    });

    const res = executePushWithSafety('main', mockExec);
    expect(res.success).toBe(true);

    // Verify sequence: switch to ademscil -> git push -> switch to AOP-B2B-DEV
    expect(executedCommands).toContain('gh auth switch --user ademscil');
    expect(executedCommands).toContain('git push origin main');
    expect(executedCommands).toContain('gh auth switch --user AOP-B2B-DEV');

    // Restoration must be after push
    const pushIdx = executedCommands.indexOf('git push origin main');
    const restoreIdx = executedCommands.indexOf('gh auth switch --user AOP-B2B-DEV');
    expect(restoreIdx).toBeGreaterThan(pushIdx);
  });

  it('T1-R6-06: Fail-Safe Account Restoration on Push Error', () => {
    const executedCommands = [];
    const mockExec = vi.fn((cmd) => {
      executedCommands.push(cmd);
      if (cmd.includes('remote.origin.url')) return 'https://github.com/ademscil/absensi.git\n';
      if (cmd.includes('git push')) {
        throw new Error('Network timeout during push');
      }
      return '';
    });

    const res = executePushWithSafety('main', mockExec);

    // Push failed, but caught
    expect(res.success).toBe(false);
    expect(res.error).toContain('Network timeout');

    // Fail-safe restoration must have been executed in finally block
    expect(executedCommands).toContain('gh auth switch --user AOP-B2B-DEV');
  });
});
