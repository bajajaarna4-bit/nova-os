// desktop.test.ts — Unit tests for desktop shell state and services
import { describe, it, expect } from 'vitest';
import { appState, APPS } from '../state/app-state.js';
import { novaApi } from '../services/nova-api.js';

describe('NOVA OS Desktop Shell Core', () => {
  it('has default applications registered', () => {
    expect(APPS['terminal']).toBeDefined();
    expect(APPS['files']).toBeDefined();
    expect(APPS['settings']).toBeDefined();
    expect(APPS['security']).toBeDefined();
    expect(APPS['ai-assistant']).toBeDefined();
  });

  it('manages window state correctly on launch', () => {
    appState.openApp('terminal');
    const windows = appState.getWindows();
    const term = windows.find(w => w.appId === 'terminal');
    expect(term).toBeDefined();
    expect(term?.focused).toBe(true);
    expect(term?.minimized).toBe(false);
  });

  it('focuses existing window on duplicate open', () => {
    appState.openApp('settings');
    const countBefore = appState.getWindows().length;
    appState.openApp('settings');
    const countAfter = appState.getWindows().length;
    expect(countAfter).toBe(countBefore);
  });

  it('minimizes and closes windows', () => {
    appState.openApp('files');
    const win = appState.getWindows().find(w => w.appId === 'files')!;
    appState.minimizeWindow(win.windowId);
    expect(win.minimized).toBe(true);

    appState.closeWindow(win.windowId);
    expect(appState.getWindows().find(w => w.appId === 'files')).toBeUndefined();
  });

  it('reads system telemetry from API service', async () => {
    const info = await novaApi.getSystemInfo();
    expect(info.hostname).toBe('nova-system');
    expect(info.osVersion).toContain('NOVA OS');
    expect(info.cpuPercent).toBeGreaterThanOrEqual(0);
  });

  it('reads security posture from API service', async () => {
    const sec = await novaApi.getSecurityStatus();
    expect(sec.selinuxMode).toBe('Enforcing');
    expect(sec.firewallActive).toBe(true);
  });
});
